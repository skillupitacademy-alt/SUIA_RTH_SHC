"""Tests for granular PlacementFileOperation derivation, pre-image hashing, and safe AST/syntax patchers."""

import pytest
from pathlib import Path
from app.models.candidate import (
    BlockFamily,
    PlacementDecision,
    PlacementManifest,
    PlacementFileAction,
    PlacementFileOperation,
)
from app.placement.comparator import CanonicalComparator
from app.placement.patcher import (
    compute_sha256,
    patch_tutorial_block_renderer,
    patch_tutorial_composer_registry,
    patch_tutorial_page_content_types,
    PatchError,
)


def test_compute_sha256_newline_normalization():
    content_crlf = "export const x = 1;\r\nexport const y = 2;\r\n"
    content_lf = "export const x = 1;\nexport const y = 2;\n"
    assert compute_sha256(content_crlf) == compute_sha256(content_lf)


def test_derive_file_operations_resolution(tmp_path):
    # Setup mock workspace
    renderer_rel = "packages/ui/src/tutorial/TutorialBlockRenderer.tsx"
    registry_rel = "apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/index.ts"
    types_rel = "packages/types/src/tutorial-page-content.types.ts"

    renderer_file = tmp_path / renderer_rel
    renderer_file.parent.mkdir(parents=True, exist_ok=True)
    renderer_file.write_text("import { A } from './blocks/A';\nswitch(block.type) {\n  default: {}\n}", encoding='utf-8')

    registry_file = tmp_path / registry_rel
    registry_file.parent.mkdir(parents=True, exist_ok=True)
    registry_file.write_text("export function getBlockTypes() { return []; }", encoding='utf-8')

    types_file = tmp_path / types_rel
    types_file.parent.mkdir(parents=True, exist_ok=True)
    types_file.write_text("export type TutorialPageContentType = 'intro';", encoding='utf-8')

    comparator = CanonicalComparator(snapshot={})
    mock_files = [
        {"filename": "README.md", "content": "# Objective Block"},
        {"filename": "ObjectiveO1Block.tsx", "content": "export function ObjectiveO1Block() {}"},
        {"filename": "ObjectiveO1Block.test.tsx", "content": "test('renders', () => {})"},
        {"filename": "objective-o1.schema.json", "content": "{}"},
        {"filename": "objective-o1.schema.ts", "content": "export const schema = {};"},
        {"filename": "registry.ts", "content": "export const objectiveRegistry = {};"},
        {"filename": "TutorialBlockRenderer.tsx", "content": "switch(b){}"},
        {"filename": "tutorial-composer.service.ts", "content": "service snippet"},
    ]

    ops = comparator.derive_file_operations(
        files=mock_files,
        family=BlockFamily.OBJECTIVE,
        version="O1",
        workspace_root=tmp_path
    )

    create_targets = {op.target_path for op in ops if op.action == PlacementFileAction.CREATE}
    assert "packages/ui/src/tutorial/blocks/ObjectiveO1Block.tsx" in create_targets
    assert "packages/ui/src/tutorial/blocks/__tests__/ObjectiveO1Block.test.tsx" in create_targets
    assert "packages/ui/src/tutorial/schemas/objective-o1.schema.json" in create_targets
    assert "packages/ui/src/tutorial/types/objective-o1.schema.ts" in create_targets
    assert "apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/objective.registry.ts" in create_targets

    patch_actions = {op.action for op in ops}
    assert PlacementFileAction.PATCH_RENDERER in patch_actions
    assert PlacementFileAction.PATCH_REGISTRY in patch_actions
    assert PlacementFileAction.PATCH_TYPES in patch_actions
    assert PlacementFileAction.SKIP in patch_actions

    # Pre-hashes must be computed for patched files
    renderer_op = next(op for op in ops if op.action == PlacementFileAction.PATCH_RENDERER)
    assert renderer_op.expected_pre_hash == compute_sha256(renderer_file.read_text(encoding='utf-8'))


def test_patch_tutorial_block_renderer():
    content = (
        "import React from 'react';\n"
        "import { HeadingBlock } from './blocks/HeadingBlock';\n\n"
        "export function TutorialBlockRenderer(props) {\n"
        "  switch (block.type) {\n"
        "    case 'heading':\n"
        "      return <HeadingBlock />;\n"
        "    default: {\n"
        "      return null;\n"
        "    }\n"
        "  }\n"
        "}\n"
    )

    patched = patch_tutorial_block_renderer(
        content,
        family="Objective",
        version="O1",
        component_name="ObjectiveO1Block"
    )

    assert "import { ObjectiveO1Block } from './blocks/ObjectiveO1Block';" in patched
    assert "case 'objective':" in patched
    assert "ObjectiveO1Block" in patched

    # Idempotency check: patching again should raise PatchError
    with pytest.raises(PatchError):
        patch_tutorial_block_renderer(patched, "Objective", "O1", "ObjectiveO1Block")


def test_patch_tutorial_composer_registry():
    content = (
        "import { codeRegistry } from './entries/code.registry';\n\n"
        "export function getBlockTypes(): BlockRegistryEntry[] {\n"
        "  return [\n"
        "    codeRegistry,\n"
        "  ];\n"
        "}\n"
    )

    patched = patch_tutorial_composer_registry(
        content,
        family="Objective",
        registry_export_name="objectiveRegistry"
    )

    assert "import { objectiveRegistry } from './entries/objective.registry';" in patched
    assert "objectiveRegistry," in patched

    # Idempotency check
    with pytest.raises(PatchError):
        patch_tutorial_composer_registry(patched, "Objective", "objectiveRegistry")


def test_patch_tutorial_page_content_types():
    content = "export type TutorialPageContentType = 'definition' | 'code' | 'summary' | 'introduction';\n"

    patched = patch_tutorial_page_content_types(content, "objective")
    assert " | 'objective'" in patched

    # Calling again should be idempotent and not duplicate
    reこと = patch_tutorial_page_content_types(patched, "objective")
    assert reこと == patched
