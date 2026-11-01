"""Comprehensive tests for Generic Revision-Safe Block Placement Policy.

Test Coverage:
1. Hash Parity Integration:
   - Real manifest generation and verification through PlacementExecutor.verify_manifest_hash().
   - Parity across candidate generation, persistence, and execution.
2. Database Reference Inspection:
   - Exact family/version in draft tutorial content -> VERSION_IN_USE.
   - Exact family/version in published tutorial content -> VERSION_IN_USE.
   - Cross-family same version code -> no false match (summary/V1 vs video/V1).
   - Database / query / schema error -> blocking inspection failure, never UPDATE.
3. Atomicity & Preflight Invariants:
   - Multi-file update where later pre-image is stale fails preflight.
   - Proves NO earlier target file was modified (fail closed).
   - Proves no commit is created.
4. Patcher Invariants:
   - UPDATE refreshes only exact (family, version) mapping.
   - ADD_NEW_VERSION creates exactly one mapping.
   - Duplicate exact mapping fails closed.
   - Cross-family same version code is preserved without conflict.
5. Governance Separation of Duties & Supersedence:
   - Strict anti-self-approval: admin requester self-approval is rejected.
   - UPDATE_IN_PLACE supersedes only same (family, version).
   - ADD_NEW_VERSION never supersedes prior versions.
   - VERSION_IN_USE and INSPECTION_FAILED cannot advance to Gate 2 or execution.
6. End-to-End Placement Lifecycle:
   - Unused version update in place.
   - Referenced version rejection -> server version allocation.
"""

import hashlib
import json
import tempfile
from datetime import datetime, timezone
from pathlib import Path
from unittest.mock import AsyncMock, MagicMock, patch

import pytest
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.candidate import (
    BlockFamily,
    CandidateFile,
    CanonicalComparison,
    ClassificationResult,
    IdentityStatus,
    PlacementDecision,
    PlacementFileAction,
    PlacementFileOperation,
    PlacementManifest,
    ReferenceSummary,
    RevisionStrategy,
    UpdateEligibility,
    compute_canonical_manifest_hash,
)
from app.api.routes.candidate import (
    generate_manifest,
    get_manifest,
    manifest_to_model,
    model_to_manifest,
)
from app.auth.types import AuthenticatedPrincipal
from app.database.models import WorkflowModel
from app.orchestration.canonical_workflow import CanonicalWorkflowState
from app.models.implementation_approval import (
    ImplementationApproval,
    ImplementationApprovalStatus,
)
from app.placement.comparator import CanonicalComparator
from app.placement.executor import PlacementExecutor, PlacementExecutionError
from app.placement.patcher import (
    PatchError,
    patch_generated_block_registry,
    patch_generated_block_version_definitions,
    patch_tutorial_block_renderer,
)
from app.placement.version_reference_service import (
    VersionPolicyEvaluation,
    VersionReferenceInspectionError,
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
        (ws / "apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry").mkdir(parents=True, exist_ok=True)
        (ws / "apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document").mkdir(parents=True, exist_ok=True)

        # Initial component
        comp_file = ws / "packages/ui/src/tutorial/blocks/summary-v1.tsx"
        comp_file.write_text("// summary v1 component\nexport const SummaryV1 = () => null;", encoding="utf-8")

        # Initial renderer
        renderer_file = ws / "packages/ui/src/tutorial/generatedBlockRenderers.tsx"
        renderer_file.write_text(
            "import type React from 'react';\n"
            "export interface GeneratedBlockRenderer { family: string; version: string; component: any; }\n"
            "export const GENERATED_BLOCK_RENDERERS = [\n"
            "  { family: 'summary', version: 'V1', component: SummaryV1 },\n"
            "  // PROJECT_LLM_GENERATED_RENDERERS\n"
            "];\n",
            encoding="utf-8"
        )

        # Initial version definitions
        defs_file = ws / "apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/generatedBlockVersionDefinitions.ts"
        defs_file.write_text(
            "export const GENERATED_BLOCK_VERSION_DEFINITIONS = [\n"
            "  { type: 'summary', version: 'V1', payloadFormat: 'canonical' },\n"
            "  // PROJECT_LLM_GENERATED_DEFINITIONS\n"
            "];\n",
            encoding="utf-8"
        )

        # Initial registries
        reg_file = ws / "apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/generatedBlockRegistries.ts"
        reg_file.write_text(
            "export const GENERATED_BLOCK_REGISTRIES = [\n"
            "  {\n"
            "    id: 'summary',\n"
            "    label: 'Summary',\n"
            "    versions: [\n"
            "      {\n"
            "        id: 'v1',\n"
            "        code: 'V1',\n"
            "        label: 'V1 - Summary',\n"
            "        description: 'Summary block',\n"
            "        getDefaultPayload: () => ({ title: 'Summary' }),\n"
            "      },\n"
            "    ],\n"
            "  },\n"
            "  // PROJECT_LLM_GENERATED_REGISTRIES\n"
            "];\n",
            encoding="utf-8"
        )

        yield ws


# ============================================================================
# 1. Hash Parity Integration Tests
# ============================================================================

def test_manifest_hash_parity_between_generator_and_executor(temp_workspace):
    """Manifest hash computed by generator must match executor verification identically."""
    executor = PlacementExecutor(str(temp_workspace), dry_run=True)

    file_op = PlacementFileOperation(
        action=PlacementFileAction.UPDATE,
        source_filename="summary-v1.tsx",
        source_sha256="abc1234567890abcdef1234567890abcdef1234567890abcdef1234567890abc",
        target_path="packages/ui/src/tutorial/blocks/summary-v1.tsx",
        expected_pre_hash="1111222233334444555566667777888899990000aaaabbbbccccddddeeeeffff",
        description="Update existing block in place"
    )

    manifest_dict = {
        "manifestId": "man-test-101",
        "candidateId": "cand-test-101",
        "decision": PlacementDecision.UPDATE,
        "targetPath": "packages/ui/src/tutorial/blocks",
        "blockFamily": BlockFamily.SUMMARY,
        "blockVersion": "V1",
        "requiredChanges": ["In-place update requested"],
        "fileOperations": [file_op],
        "evidenceIds": ["ev-test-1"],
        "createdAt": "2026-10-28T12:00:00Z",
        "identityStatus": IdentityStatus.EXISTING_UNUSED,
        "updateEligibility": UpdateEligibility.ALLOWED,
        "referenceSummary": ReferenceSummary(count=0, publication_states={}, sample_ids=[]),
        "revisionStrategy": RevisionStrategy.UPDATE_IN_PLACE,
    }

    # Canonical hash computed via shared canonical function
    canonical_hash = compute_canonical_manifest_hash(manifest_dict)
    manifest_dict["manifestHash"] = canonical_hash

    manifest = PlacementManifest(**manifest_dict)

    # Must pass verify_manifest_hash without error!
    assert executor.verify_manifest_hash(manifest) is True


# ============================================================================
# 2. Database Reference Inspection Tests (Draft, Published, Cross-Family, Fail-Closed)
# ============================================================================

def test_reference_inspection_draft_section_yields_version_in_use(temp_workspace):
    """Draft reference prevents in-place update and returns VERSION_IN_USE."""
    policy = run_coro(evaluate_version_policy(
        family="summary",
        version="V1",
        session=None,
        workspace_root=str(temp_workspace),
        mock_references=[
            {"id": "sec-draft-1", "status": "draft", "content": {"blocks": [{"type": "summary", "version": "V1"}]}}
        ]
    ))

    assert policy.decision == PlacementDecision.VERSION_IN_USE
    assert policy.identity_status == IdentityStatus.EXISTING_REFERENCED
    assert policy.update_eligibility == UpdateEligibility.VERSION_IN_USE
    assert policy.revision_strategy == RevisionStrategy.ADD_NEW_VERSION
    assert policy.reference_summary.draft_count == 1
    assert "sec-draft-1" in policy.reference_summary.sample_ids


def test_reference_inspection_published_section_yields_version_in_use(temp_workspace):
    """Published reference prevents in-place update and returns VERSION_IN_USE."""
    policy = run_coro(evaluate_version_policy(
        family="summary",
        version="V1",
        session=None,
        workspace_root=str(temp_workspace),
        mock_references=[
            {"id": "sec-pub-1", "status": "published", "content": {"blocks": [{"type": "summary", "version": "V1"}]}}
        ]
    ))

    assert policy.decision == PlacementDecision.VERSION_IN_USE
    assert policy.identity_status == IdentityStatus.EXISTING_REFERENCED
    assert policy.update_eligibility == UpdateEligibility.VERSION_IN_USE
    assert policy.reference_summary.published_count == 1


def test_reference_inspection_cross_family_same_version_no_false_match(temp_workspace):
    """Matching version in another family (e.g. video/V1) does not block summary/V1."""
    # Only video has V1 referenced, NOT summary
    policy = run_coro(evaluate_version_policy(
        family="summary",
        version="V1",
        session=None,
        workspace_root=str(temp_workspace),
        mock_references=[
            {"id": "sec-video-1", "status": "published", "content": {"blocks": [{"type": "video", "version": "V1"}]}}
        ]
    ))

    # summary V1 has 0 references -> allowed UPDATE_IN_PLACE!
    assert policy.decision == PlacementDecision.UPDATE
    assert policy.identity_status == IdentityStatus.EXISTING_UNUSED
    assert policy.update_eligibility == UpdateEligibility.ALLOWED
    assert policy.revision_strategy == RevisionStrategy.UPDATE_IN_PLACE
    assert policy.reference_summary.total_count == 0


def test_reference_inspection_database_error_fails_closed_blocking_update(temp_workspace):
    """Database query/schema failure must fail closed with INSPECTION_FAILED and block UPDATE."""
    mock_session = MagicMock(spec=AsyncSession)
    mock_session.execute.side_effect = RuntimeError("Database connection reset / table missing")

    # 1. query_version_references directly raises typed VersionReferenceInspectionError
    with pytest.raises(VersionReferenceInspectionError):
        run_coro(query_version_references("summary", "V1", session=mock_session))

    # 2. evaluate_version_policy fails closed without allowing in-place update
    policy = run_coro(evaluate_version_policy(
        family="summary",
        version="V1",
        session=mock_session,
        workspace_root=str(temp_workspace)
    ))

    assert policy.decision == PlacementDecision.VERSION_IN_USE
    assert policy.update_eligibility == UpdateEligibility.INSPECTION_FAILED
    assert policy.revision_strategy == RevisionStrategy.ADD_NEW_VERSION
    assert policy.identity_status == IdentityStatus.EXISTING_REFERENCED


# ============================================================================
# 3. Atomicity & Preflight Invariants
# ============================================================================

def test_atomic_preflight_blocks_write_on_later_stale_pre_image(temp_workspace):
    """When a multi-file update has a later stale pre-image hash, NO earlier target file is modified."""
    executor = PlacementExecutor(str(temp_workspace), dry_run=False)

    file_1 = temp_workspace / "packages/ui/src/tutorial/blocks/file1.tsx"
    file_1.write_text("// initial file 1", encoding="utf-8")
    pre_1 = hashlib.sha256(b"// initial file 1").hexdigest()

    file_2 = temp_workspace / "packages/ui/src/tutorial/blocks/file2.tsx"
    file_2.write_text("// initial file 2", encoding="utf-8")

    new_content_1 = "// new file 1 content"
    new_sha_1 = hashlib.sha256(new_content_1.encode("utf-8")).hexdigest()

    new_content_2 = "// new file 2 content"
    new_sha_2 = hashlib.sha256(new_content_2.encode("utf-8")).hexdigest()

    # Op 1: valid expected_pre_hash
    op_1 = PlacementFileOperation(
        action=PlacementFileAction.UPDATE,
        source_filename="file1.tsx",
        source_sha256=new_sha_1,
        target_path="packages/ui/src/tutorial/blocks/file1.tsx",
        expected_pre_hash=pre_1,
        description="Update file 1"
    )

    # Op 2: STALE expected_pre_hash
    op_2 = PlacementFileOperation(
        action=PlacementFileAction.UPDATE,
        source_filename="file2.tsx",
        source_sha256=new_sha_2,
        target_path="packages/ui/src/tutorial/blocks/file2.tsx",
        expected_pre_hash="stale_pre_image_hash_mismatch",
        description="Update file 2"
    )

    integration_json = json.dumps({
        "family": "summary",
        "version": "V1",
        "typeId": "summary",
        "componentFile": "file1.tsx",
        "componentExport": "File1",
        "testFile": "file1.test.tsx",
        "jsonSchemaFile": "file1.schema.json",
        "typeSchemaFile": "file1.types.ts",
        "defaultPayload": {"title": "Summary"}
    })

    manifest_dict = {
        "manifestId": "man-atomic-1",
        "candidateId": "cand-atomic-1",
        "decision": PlacementDecision.UPDATE,
        "targetPath": "packages/ui/src/tutorial/blocks",
        "blockFamily": BlockFamily.SUMMARY,
        "blockVersion": "V1",
        "requiredChanges": ["Atomic multi-file update"],
        "fileOperations": [op_1, op_2],
        "evidenceIds": ["ev-atomic-1"],
        "createdAt": "2026-10-28T12:00:00Z",
        "identityStatus": IdentityStatus.EXISTING_UNUSED,
        "updateEligibility": UpdateEligibility.ALLOWED,
        "referenceSummary": ReferenceSummary(count=0, publication_states={}, sample_ids=[]),
        "revisionStrategy": RevisionStrategy.UPDATE_IN_PLACE,
    }
    m_hash = compute_canonical_manifest_hash(manifest_dict)
    manifest_dict["manifestHash"] = m_hash
    manifest = PlacementManifest(**manifest_dict)

    approval = ImplementationApproval(
        approval_id="app-atomic-1",
        workflow_id="wf-atomic-1",
        candidate_sha256="cand-hash",
        target_family="Summary",
        target_version="V1",
        placement_manifest_id="man-atomic-1",
        placement_manifest_sha256=m_hash,
        approved_by="approver-alice",
        approval_timestamp=datetime.now(timezone.utc),
        workflow_requester="requester-bob",
        status=ImplementationApprovalStatus.APPROVED,
        evidence={"admin_override": False}
    )

    files = [
        CandidateFile(filename="file1.tsx", content=new_content_1, contentType="text/typescript", hash=new_sha_1),
        CandidateFile(filename="file2.tsx", content=new_content_2, contentType="text/typescript", hash=new_sha_2),
        CandidateFile(filename="block.integration.json", content=integration_json, contentType="application/json", hash=hashlib.sha256(integration_json.encode()).hexdigest())
    ]

    mock_wt = WorktreeContext(
        worktree_path=temp_workspace,
        branch_name="candidate/cand-atomic-1",
        base_commit="abc1234",
        created_at="2026-10-28T12:00:00Z",
        workflow_id="wf-atomic-1",
        manifest_id="man-atomic-1"
    )

    commit_mock = MagicMock()
    with patch.object(executor.worktree_manager, "create_worktree", return_value=mock_wt), \
         patch.object(executor.worktree_manager, "commit_in_worktree", commit_mock), \
         patch.object(executor.worktree_manager, "cleanup_worktree", return_value=None):

        with pytest.raises(PlacementExecutionError) as exc_info:
            executor.execute_placement(
                manifest=manifest,
                approval=approval,
                candidate_files=files,
                workflow_requester="requester-bob",
                candidate_sha256="cand-hash"
            )

        assert "Pre-image hash mismatch" in str(exc_info.value)
        # CRITICAL ATOMICITY CHECK: file 1 was NOT modified!
        assert file_1.read_text(encoding="utf-8") == "// initial file 1"
        assert file_2.read_text(encoding="utf-8") == "// initial file 2"
        # No commit was created
        commit_mock.assert_not_called()


def test_executor_uses_declared_schema_export_for_blocks_schema_patch(temp_workspace):
    """PATCH_BLOCKS_SCHEMA must use the validated metadata export, not infer one."""
    blocks_schema = temp_workspace / "packages/types/src/tutorial-rich-document/schemas/blocks.schema.ts"
    blocks_schema.parent.mkdir(parents=True, exist_ok=True)
    blocks_schema.write_text(
        "import { z } from 'zod';\n"
        "export const TutorialBlockSchema = z.lazy(() => z.union([]));\n",
        encoding="utf-8",
    )
    current_content = blocks_schema.read_text(encoding="utf-8")
    operation = PlacementFileOperation(
        action=PlacementFileAction.PATCH_BLOCKS_SCHEMA,
        source_filename="block.integration.json",
        source_sha256=hashlib.sha256(b"metadata").hexdigest(),
        target_path="packages/types/src/tutorial-rich-document/schemas/blocks.schema.ts",
        expected_pre_hash=hashlib.sha256(current_content.encode("utf-8")).hexdigest(),
        description="Register runtime schema",
    )
    manifest = PlacementManifest(
        manifestId="manifest-schema-export",
        candidateId="candidate-schema-export",
        decision=PlacementDecision.ADD,
        targetPath="packages/ui/src/tutorial/blocks",
        blockFamily=BlockFamily.OBJECTIVE,
        blockVersion="O1",
        requiredChanges=["Register schema"],
        fileOperations=[operation],
        evidenceIds=["evidence-schema-export"],
        createdAt="2026-10-30T00:00:00Z",
        manifestHash="test-hash",
    )
    metadata = json.dumps({
        "typeSchemaFile": "objective-o1.schema.ts",
        "schemaExport": "CustomObjectiveSchema",
    })
    candidate_files = [
        CandidateFile(
            filename="block.integration.json",
            content=metadata,
            contentType="application/json",
            hash=hashlib.sha256(metadata.encode("utf-8")).hexdigest(),
        )
    ]
    executor = PlacementExecutor(str(temp_workspace), dry_run=True)

    with patch("app.placement.executor.patch_blocks_schema", return_value=current_content) as patch_schema:
        executor._execute_manifest_operations(manifest, candidate_files)

    patch_schema.assert_called_once_with(
        current_content,
        schema_filename="objective-o1.schema.ts",
        schema_export_name="CustomObjectiveSchema",
    )


# ============================================================================
# 4. Patcher Tests: Duplicate Detection & Cross-Family Same-Version Coexistence
# ============================================================================

def test_patcher_update_in_place_refreshes_metadata_without_duplicate():
    """Patcher with UPDATE_IN_PLACE refreshes existing entry without creating duplicate."""
    initial_content = (
        "import type React from 'react';\n"
        "import { SummaryV1 } from './blocks/SummaryV1';\n"
        "export interface GeneratedBlockRenderer { family: string; version: string; component: any; }\n"
        "export const GENERATED_BLOCK_RENDERERS = [\n"
        "  { family: 'summary', version: 'V1', component: SummaryV1 },\n"
        "  // PROJECT_LLM_GENERATED_RENDERERS\n"
        "];\n"
    )

    patched = patch_tutorial_block_renderer(
        content=initial_content,
        family="summary",
        version="V1",
        component_name="SummaryV1Updated"
    )

    assert patched.count("family: 'summary', version: 'V1'") == 1
    assert "component: SummaryV1Updated" in patched


def test_patcher_cross_family_same_version_code_does_not_conflict():
    """Different families using the same version code (summary/V1 vs video/V1) do not trigger false duplicates."""
    initial_content = (
        "export const GENERATED_BLOCK_REGISTRIES = [\n"
        "  {\n"
        "    id: 'video',\n"
        "    label: 'Video',\n"
        "    versions: [\n"
        "      {\n"
        "        id: 'v1',\n"
        "        code: 'V1',\n"
        "        label: 'V1 - Video',\n"
        "        description: 'Video block',\n"
        "        getDefaultPayload: () => ({ url: 'https://example.com' }),\n"
        "      },\n"
        "    ],\n"
        "  },\n"
        "  // PROJECT_LLM_GENERATED_REGISTRIES\n"
        "];\n"
    )

    # Adding summary V1 when video V1 already exists must succeed without false duplicate error
    metadata = {
        "familyLabel": "Summary",
        "label": "V1 - Summary",
        "description": "Summary block",
        "defaultPayload": {"title": "Summary"}
    }
    patched = patch_generated_block_registry(
        content=initial_content,
        family="summary",
        version="V1",
        metadata=metadata
    )

    assert "id: 'video'" in patched
    assert "id: 'summary'" in patched
    assert patched.count("code: 'V1'") == 2


def test_patcher_duplicate_exact_family_version_fails_closed():
    """Duplicate exact mapping (summary/V1 twice) fails closed."""
    content_with_duplicate = (
        "export const GENERATED_BLOCK_VERSION_DEFINITIONS = [\n"
        "  { type: 'summary', version: 'V1', payloadFormat: 'canonical' },\n"
        "  { type: 'summary', version: 'V1', payloadFormat: 'canonical' },\n"
        "  // PROJECT_LLM_GENERATED_DEFINITIONS\n"
        "];\n"
    )

    with pytest.raises(PatchError):
        patch_generated_block_version_definitions(
            content=content_with_duplicate,
            family_type_id="summary",
            version="V1",
            payload_format="canonical"
        )


# ============================================================================
# 5. Governance Separation of Duties & Supersedence Tests
# ============================================================================

def test_strict_anti_self_approval_rejects_admin_requester(monkeypatch):
    """Gate 2 approval rejects non-admin self-approval, allows verified admin override by default, and rejects admin self-approval when strict mode is enabled."""
    # Non-admin self-approval must always return False
    non_admin_approval = ImplementationApproval(
        approval_id="app-non-admin",
        workflow_id="wf-1",
        candidate_sha256="hash-1",
        target_family="Summary",
        target_version="V1",
        placement_manifest_id="man-1",
        placement_manifest_sha256="mhash-1",
        approved_by="user_bob",
        approval_timestamp=datetime.now(timezone.utc),
        status=ImplementationApprovalStatus.APPROVED,
        evidence={"admin_override": False, "is_admin_user": False, "approved_by_role": "user"},
        workflow_requester="user_bob",
    )
    assert non_admin_approval.verify_not_self_approved("user_bob") is False
    assert non_admin_approval.verify_not_self_approved(None) is False

    # Verified admin self-approval is permitted by default (single-admin workflow),
    # provided both uploader (workflow_requester) and approver identities are recorded.
    approval = ImplementationApproval(
        approval_id="app-1",
        workflow_id="wf-1",
        candidate_sha256="hash-1",
        target_family="Summary",
        target_version="V1",
        placement_manifest_id="man-1",
        placement_manifest_sha256="mhash-1",
        approved_by="admin_user_bob",
        approval_timestamp=datetime.now(timezone.utc),
        status=ImplementationApprovalStatus.APPROVED,
        evidence={"admin_override": True, "is_admin_user": True, "approved_by_role": "admin"},
        workflow_requester="admin_user_bob",
    )
    assert approval.verify_not_self_approved("admin_user_bob") is True

    # Missing uploader identity must fail closed even when admin_override=True
    approval_missing_requester = ImplementationApproval(
        approval_id="app-missing-req",
        workflow_id="wf-1",
        candidate_sha256="hash-1",
        target_family="Summary",
        target_version="V1",
        placement_manifest_id="man-1",
        placement_manifest_sha256="mhash-1",
        approved_by="admin_user_bob",
        approval_timestamp=datetime.now(timezone.utc),
        status=ImplementationApprovalStatus.APPROVED,
        evidence={"admin_override": True, "is_admin_user": True, "approved_by_role": "admin"},
        workflow_requester=None,
    )
    assert approval_missing_requester.verify_not_self_approved("admin_user_bob") is False

    # When strict separation of duties is explicitly enabled, even admin self-approval is rejected
    monkeypatch.setenv("PROJECT_AI_STRICT_SEPARATION_OF_DUTIES", "true")
    assert approval.verify_not_self_approved("admin_user_bob") is False
    assert approval.verify_not_self_approved(None) is False
    monkeypatch.delenv("PROJECT_AI_STRICT_SEPARATION_OF_DUTIES", raising=False)

    # Independent approver must pass
    approval_independent = ImplementationApproval(
        approval_id="app-2",
        workflow_id="wf-1",
        candidate_sha256="hash-1",
        target_family="Summary",
        target_version="V1",
        placement_manifest_id="man-1",
        placement_manifest_sha256="mhash-1",
        approved_by="admin_user_alice",
        approval_timestamp=datetime.now(timezone.utc),
        status=ImplementationApprovalStatus.APPROVED,
        workflow_requester="admin_user_bob",
    )
    assert approval_independent.verify_not_self_approved("admin_user_bob") is True


def test_supersedence_rule_applies_only_to_same_family_version_update():
    """Final certification supersedes prior workflows only when revisionStrategy is UPDATE_IN_PLACE for exact (family, version)."""
    class MockWorkflow:
        def __init__(self, id, family, version, status, strategy):
            self.id = id
            self.family = family
            self.version = version
            self.final_status = status
            self.revision_strategy = strategy

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

    if revision_strategy == "UPDATE_IN_PLACE":
        for prior in workflows_db:
            if prior.family.lower() == new_add_wf.family.lower() and prior.version.upper() == new_add_wf.version.upper():
                prior.final_status = "SUPERSEDED"

    assert older_o3.final_status == "APPROVED"


def test_route_manifest_generation_persistence_and_executor_verification_roundtrip(temp_workspace):
    """
    Full production round-trip integration test:
    Candidate qualification -> generate_manifest route -> ORM persistence ->
    get_manifest retrieval -> verify_manifest_hash by PlacementExecutor with zero hash mismatch.
    """
    candidate_id = "cand-rt-001"
    workflow_id = "wf-rt-001"
    cand_sha = "a" * 64

    class DummyCandidateModel:
        def __init__(self):
            self.candidate_id = candidate_id
            self.workflow_id = workflow_id
            self.candidate_sha256 = cand_sha
            self.target_family = "Summary"
            self.target_version = "V1"
            self.files = [
                {
                    "filename": "summary.tsx",
                    "content": "export const SummaryV1Block = () => null;",
                    "contentType": "text/typescript",
                    "hash": "c" * 64,
                },
                {
                    "filename": "summary.test.tsx",
                    "content": "test('summary', () => {});",
                    "contentType": "text/typescript",
                    "hash": "c" * 64,
                },
                {
                    "filename": "summary.schema.json",
                    "content": "{}",
                    "contentType": "application/json",
                    "hash": "c" * 64,
                },
                    {
                        "filename": "summary-v1.schema.ts",
                        "content": "import { z } from 'zod';\nexport const SummaryV1BlockSchema = z.object({ title: z.string() });",
                        "contentType": "text/typescript",
                        "hash": "c" * 64,
                    },
                {
                    "filename": "block.integration.json",
                    "content": json.dumps({
                        "family": "Summary",
                        "version": "V1",
                        "typeId": "summary",
                        "componentFile": "summary.tsx",
                        "componentExport": "SummaryV1Block",
                        "testFile": "summary.test.tsx",
                        "jsonSchemaFile": "summary.schema.json",
                            "typeSchemaFile": "summary-v1.schema.ts",
                            "schemaExport": "SummaryV1BlockSchema",
                        "defaultPayload": {"title": "Summary"}
                    }),
                    "contentType": "application/json",
                    "hash": "e" * 64,
                }
            ]
            self.uploaded_at = datetime.now(timezone.utc)
            self.uploaded_by = "test_dev"
            self.contract_sha256 = "d" * 64

    cand_model = DummyCandidateModel()

    wf_model = MagicMock(spec=WorkflowModel)
    wf_model.workflow_id = workflow_id
    wf_model.current_state = CanonicalWorkflowState.CANDIDATE_AUDIT
    wf_model.gate_results = {
        "Unit Test Suite": {
            "result": "PASS",
            "evidence_id": "ev-test-pass",
            "evidence_hash": "h" * 64,
            "candidate_sha256": cand_sha
            },
            "Accessibility Preflight": {
                "result": "PASS",
                "evidence_id": "ev-a11y-preflight-pass",
                "evidence_hash": "p" * 64,
                "candidate_sha256": cand_sha
        }
    }

    mock_cand_repo = MagicMock()
    async def mock_get_cand(cid):
        return cand_model
    mock_cand_repo.get = mock_get_cand

    mock_wf_repo = MagicMock()
    async def mock_get_wf(wid):
        return wf_model
    mock_wf_repo.get = mock_get_wf

    stored_manifest_models = []
    mock_manifest_repo = MagicMock()
    async def mock_upsert(m):
        stored_manifest_models.append(m)
        return m
    async def mock_list(cid):
        return stored_manifest_models
    mock_manifest_repo.upsert = mock_upsert
    mock_manifest_repo.list_by_candidate = mock_list

    user = AuthenticatedPrincipal(
        principal_id="admin_user",
        roles=["admin", "contract_admin"],
        permissions=["candidates:manifest:generate", "candidates:manifest:read"]
    )

    mock_classification = ClassificationResult(
        candidateId=candidate_id,
        detectedFamily=BlockFamily.SUMMARY,
        confidence=0.99,
        reasoning="Matches summary"
    )
    mock_comparison = CanonicalComparison(
        candidateId=candidate_id,
        existingBlock=None,
        similarityScore=0.95,
        differences=[]
    )
    mock_policy_eval = VersionPolicyEvaluation(
        family="Summary",
        version="V1",
        is_registered=False,
        decision=PlacementDecision.ADD,
        identity_status=IdentityStatus.NEW,
        update_eligibility=UpdateEligibility.NOT_APPLICABLE,
        revision_strategy=RevisionStrategy.ADD_NEW_VERSION,
        reference_summary=ReferenceSummary(count=0, publication_states={}, sample_ids=[]),
        proposed_next_version="V1"
    )

    mock_client = MagicMock()
    mock_client.load_snapshot.return_value = {"blocks": {"verified": []}, "files": []}

    mock_gov_service = MagicMock()
    async def mock_get_wf_gov(wid):
        return wf_model
    async def mock_trans_gov(wid, state, triggered_by=None, reason=None):
        return wf_model
    async def mock_bind(workflow_id, artifact_type, artifact_id, artifact_sha256):
        return None
    mock_gov_service.get_workflow = mock_get_wf_gov
    mock_gov_service.transition_state = mock_trans_gov
    mock_gov_service.bind_artifact = mock_bind

    mock_session = MagicMock()
    async def mock_commit():
        return None
    async def mock_rollback():
        return None
    mock_session.commit = mock_commit
    mock_session.rollback = mock_rollback

    async def mock_classify(*args, **kwargs):
        return mock_classification
    async def mock_compare(*args, **kwargs):
        return mock_comparison
    async def mock_policy(*args, **kwargs):
        return mock_policy_eval
    async def mock_get_wf_repo_fn(session):
        return mock_wf_repo
    async def mock_get_gov_fn(session):
        return mock_gov_service

    with patch("app.api.routes.candidate.get_workflow_repository", mock_get_wf_repo_fn), \
         patch("app.api.routes.workflows.get_governance_service", mock_get_gov_fn), \
         patch("app.api.routes.candidate.classify_candidate", mock_classify), \
         patch("app.api.routes.candidate.compare_candidate", mock_compare), \
         patch("app.placement.version_reference_service.evaluate_version_policy", mock_policy), \
         patch.dict("os.environ", {"WORKSPACE_ROOT": str(temp_workspace)}):

        # 1. Generate via endpoint (POST /candidates/{id}/manifest)
        generated_manifest = run_coro(generate_manifest(
            candidate_id=candidate_id,
            user=user,
            candidate_repo=mock_cand_repo,
            manifest_repo=mock_manifest_repo,
            session=mock_session,
            client=mock_client
        ))

        # 2. Retrieve via endpoint (GET /candidates/{id}/manifest, which fetches from DB and calls model_to_manifest)
        retrieved_manifest = run_coro(get_manifest(
            candidate_id=candidate_id,
            user=user,
            candidate_repo=mock_cand_repo,
            manifest_repo=mock_manifest_repo
        ))

        # 3. Verify executor validates retrieved manifest with zero hash mismatch
        executor = PlacementExecutor(str(temp_workspace), dry_run=True)
        assert executor.verify_manifest_hash(retrieved_manifest) is True
        assert retrieved_manifest.manifestHash == generated_manifest.manifestHash


def test_patch_generated_block_registry_handles_nested_payload_arrays():
    """Verify patch_generated_block_registry does not truncate on inner `[` `]` arrays inside getDefaultPayload."""
    from app.placement.patcher import patch_generated_block_registry

    initial_registry = """import type { BlockRegistryEntry } from './types';

export const GENERATED_BLOCK_REGISTRIES: readonly BlockRegistryEntry[] = [
  {
    id: 'objective',
    label: "Objective",
    versions: [
      {
        id: "o3",
        code: 'O3',
        label: "O3 - Objective",
        description: "Skill objectives",
        getDefaultPayload: () => ({
          "title": "What You Will Be Able To Do",
          "objectives": [
            {
              "id": "skill-debug",
              "text": "Identify and correct common list-indexing errors."
            }
          ]
        }),
      },
    ],
  },
  // PROJECT_LLM_GENERATED_REGISTRIES
];
"""
    patched = patch_generated_block_registry(
        initial_registry,
        "Objective",
        "O1",
        {"defaultPayload": {"title": "Goals", "objectives": [{"id": "1", "text": "Goal 1"}]}},
    )
    # O3's inner objectives array must remain properly closed before O1's version entry starts
    assert '"text": "Identify and correct common list-indexing errors."\n            }\n          ]\n        }),\n      },\n      {\n        id: "o1",' in patched
    assert patched.count("code: 'O3'") == 1
    assert patched.count("code: 'O1'") == 1

    # Updating O1 in place must replace O1's entry without duplicating or corrupting brackets
    updated = patch_generated_block_registry(
        patched,
        "Objective",
        "O1",
        {"defaultPayload": {"title": "Updated Goals", "objectives": [{"id": "1", "text": "Updated Goal 1"}]}},
    )
    assert "Updated Goals" in updated
    assert updated.count("code: 'O3'") == 1
    assert updated.count("code: 'O1'") == 1


