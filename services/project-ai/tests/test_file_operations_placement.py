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
    patch_family_registry,
    patch_tutorial_composer_registry,
    patch_tutorial_page_content_types,
    patch_generated_block_version_definitions,
    patch_generated_block_registry,
    patch_blocks_schema,
    PatchError,
)


def test_compute_sha256_newline_normalization():
    content_crlf = "export const x = 1;\r\nexport const y = 2;\r\n"
    content_lf = "export const x = 1;\nexport const y = 2;\n"
    assert compute_sha256(content_crlf) == compute_sha256(content_lf)


def test_derive_file_operations_resolution(tmp_path):
    # Setup mock workspace
    renderer_rel = "packages/ui/src/tutorial/generatedBlockRenderers.tsx"
    generated_registry_rel = "apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/generatedBlockRegistries.ts"

    renderer_file = tmp_path / renderer_rel
    renderer_file.parent.mkdir(parents=True, exist_ok=True)
    renderer_file.write_text(
        "import type React from 'react';\n"
        "export interface GeneratedBlockRenderer {}\n"
        "export const GENERATED_BLOCK_RENDERERS = [\n"
        "  // PROJECT_LLM_GENERATED_RENDERERS\n"
        "];\n",
        encoding='utf-8',
    )

    generated_registry_file = tmp_path / generated_registry_rel
    generated_registry_file.parent.mkdir(parents=True, exist_ok=True)
    generated_registry_file.write_text(
        "export const GENERATED_BLOCK_REGISTRIES = [\n"
        "  // PROJECT_LLM_GENERATED_REGISTRIES\n"
        "];\n",
        encoding='utf-8',
    )

    blocks_schema_rel = "packages/types/src/tutorial-rich-document/schemas/blocks.schema.ts"
    blocks_schema_file = tmp_path / blocks_schema_rel
    blocks_schema_file.parent.mkdir(parents=True, exist_ok=True)
    blocks_schema_file.write_text(
        "import { z } from 'zod';\n"
        "export const TutorialBlockSchema: z.ZodType<any> = z.lazy(() => z.union([]));\n",
        encoding='utf-8',
    )

    comparator = CanonicalComparator(snapshot={})
    mock_files = [
        {"filename": "README.md", "content": "# Objective Block"},
        {"filename": "ObjectiveO1Block.tsx", "content": "export function ObjectiveO1Block() {}"},
        {"filename": "ObjectiveO1Block.test.tsx", "content": "test('renders', () => {})"},
        {"filename": "objective-o1.schema.json", "content": "{}"},
        {"filename": "objective-o1.schema.ts", "content": "import { z } from 'zod';\nexport const ObjectiveO1BlockSchema = z.object({ title: z.string() });"},
        {"filename": "block.integration.json", "content": '{"family":"Objective","version":"O1","typeId":"objective","componentFile":"ObjectiveO1Block.tsx","componentExport":"ObjectiveO1Block","testFile":"ObjectiveO1Block.test.tsx","jsonSchemaFile":"objective-o1.schema.json","typeSchemaFile":"objective-o1.schema.ts","schemaExport":"ObjectiveO1BlockSchema","defaultPayload":{"title":"Example","objectives":[]}}'},
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
    assert "packages/types/src/tutorial-rich-document/schemas/objective-o1.schema.ts" in create_targets
    assert "apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/entries/objective.registry.ts" not in create_targets

    patch_actions = {op.action for op in ops}
    assert PlacementFileAction.PATCH_RENDERER in patch_actions
    assert PlacementFileAction.PATCH_GENERATED_REGISTRY in patch_actions
    assert PlacementFileAction.PATCH_FAMILY_REGISTRY not in patch_actions
    assert PlacementFileAction.PATCH_REGISTRY not in patch_actions
    assert PlacementFileAction.PATCH_TYPES not in patch_actions
    assert PlacementFileAction.PATCH_COMPOSER_DEFINITION in patch_actions
    assert PlacementFileAction.PATCH_BLOCKS_SCHEMA in patch_actions
    assert PlacementFileAction.SKIP in patch_actions

    # Pre-hashes must be computed for patched files
    renderer_op = next(op for op in ops if op.action == PlacementFileAction.PATCH_RENDERER)
    assert renderer_op.expected_pre_hash == compute_sha256(renderer_file.read_text(encoding='utf-8'))
    generated_registry_op = next(op for op in ops if op.action == PlacementFileAction.PATCH_GENERATED_REGISTRY)
    assert generated_registry_op.expected_pre_hash == compute_sha256(generated_registry_file.read_text(encoding='utf-8'))
    blocks_schema_op = next(op for op in ops if op.action == PlacementFileAction.PATCH_BLOCKS_SCHEMA)
    assert blocks_schema_op.expected_pre_hash == compute_sha256(blocks_schema_file.read_text(encoding='utf-8'))


def test_derive_file_operations_rejects_incomplete_portable_contract(tmp_path):
    comparator = CanonicalComparator(snapshot={})
    with pytest.raises(ValueError, match="missing required portable contract fields"):
        comparator.derive_file_operations(
            files=[
                {"filename": "ExampleBlock.tsx", "content": "export function ExampleBlock() {}"},
                {"filename": "block.integration.json", "content": '{"family":"Objective","version":"O1","typeId":"objective","componentFile":"ExampleBlock.tsx","componentExport":"ExampleBlock","defaultPayload":{}}'},
            ],
            family=BlockFamily.OBJECTIVE,
            version="O1",
            workspace_root=tmp_path,
        )


def test_patch_tutorial_block_renderer():
    content = (
        "import type React from 'react';\n"
        "export interface GeneratedBlockRenderer {}\n"
        "export const GENERATED_BLOCK_RENDERERS = [\n"
        "  // PROJECT_LLM_GENERATED_RENDERERS\n"
        "];\n"
    )

    patched = patch_tutorial_block_renderer(
        content,
        family="Objective",
        version="O1",
        component_name="ObjectiveO1Block"
    )

    assert "import { ObjectiveO1Block } from './blocks/ObjectiveO1Block';" in patched
    assert "{ family: 'objective', version: 'O1', component: ObjectiveO1Block }," in patched

    # Idempotency check: applying the same operation must not duplicate changes.
    assert patch_tutorial_block_renderer(patched, "Objective", "O1", "ObjectiveO1Block") == patched


def test_patch_tutorial_block_renderer_preserves_existing_family_versions():
    content = (
        "import { ObjectiveO1Block } from './blocks/ObjectiveO1Block';\n\n"
        "export interface GeneratedBlockRenderer {}\n"
        "export const GENERATED_BLOCK_RENDERERS = [\n"
        "  { family: 'objective', version: 'O1', component: ObjectiveO1Block },\n"
        "  // PROJECT_LLM_GENERATED_RENDERERS\n"
        "];\n"
    )

    patched = patch_tutorial_block_renderer(content, "Objective", "O2", "ObjectiveO2Block")

    assert "import { ObjectiveO2Block } from './blocks/ObjectiveO2Block';" in patched
    assert "version: 'O1'" in patched
    assert "version: 'O2'" in patched
    assert patched.count("family: 'objective'") == 2

    patched = patch_tutorial_block_renderer(patched, "Objective", "O3", "ObjectiveO3Block")
    assert "import { ObjectiveO3Block } from './blocks/ObjectiveO3Block';" in patched
    assert "version: 'O1'" in patched
    assert "version: 'O2'" in patched
    assert "version: 'O3'" in patched
    assert patched.count("family: 'objective'") == 3


def test_patch_family_registry_appends_version_without_removing_existing_versions():
    content = """import type { BlockRegistryEntry } from '../types';

export const objectiveRegistry: BlockRegistryEntry = {
  id: 'objective',
  label: 'Objective',
  versions: [
    { id: 'v1', code: 'O1', label: 'O1 - Objective', description: 'Existing', getDefaultPayload: () => ({ title: 'O1' }) },
  ],
};
"""
    metadata = {
        "defaultPayload": {"title": "O2", "objectives": []},
        "label": "O2 - Objective",
        "description": "Second objective version",
    }

    patched = patch_family_registry(content, "Objective", "O2", metadata)
    assert "code: 'O1'" in patched
    assert "code: 'O2'" in patched
    assert patch_family_registry(patched, "Objective", "O2", metadata) == patched


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

    # Idempotency check: applying the same operation must not duplicate changes.
    assert patch_tutorial_composer_registry(patched, "Objective", "objectiveRegistry") == patched


def test_patch_tutorial_page_content_types():
    content = "export type TutorialPageContentType = 'definition' | 'code' | 'summary' | 'introduction';\n"

    patched = patch_tutorial_page_content_types(content, "objective")
    assert " | 'objective'" in patched


def test_patch_generated_block_registry_appends_metadata_idempotently():
    content = """import type { BlockRegistryEntry } from './types';

export const GENERATED_BLOCK_REGISTRIES: readonly BlockRegistryEntry[] = [
  // PROJECT_LLM_GENERATED_REGISTRIES
];
"""
    metadata = {
        "defaultPayload": {"title": "Example", "items": []},
        "label": "O3 - Objective",
        "description": "Third objective version",
    }

    patched = patch_generated_block_registry(content, "Objective", "O3", metadata)
    assert "id: 'objective'" in patched
    assert "code: 'O3'" in patched
    assert "getDefaultPayload" in patched
    assert patch_generated_block_registry(patched, "Objective", "O3", metadata) == patched


def test_patch_generated_block_version_definitions():
    content = """import type { TutorialPageContentType } from '@quiz/types';

export type TutorialPageContentType = 'definition';

export const GENERATED_BLOCK_VERSION_DEFINITIONS = [
  // PROJECT_LLM_GENERATED_DEFINITIONS
];
"""

    patched = patch_generated_block_version_definitions(content, "objective", "O3")
    assert "{ type: 'objective', version: 'O3', payloadFormat: 'canonical' }," in patched
    assert patch_generated_block_version_definitions(patched, "objective", "O3") == patched
    patched = patch_tutorial_page_content_types(patched, "objective")

    # Calling again should be idempotent and not duplicate
    reこと = patch_tutorial_page_content_types(patched, "objective")
    assert reこと == patched


def test_patch_blocks_schema_adds_first_schema():
    """Test adding first block schema to union (when only base imports exist)."""
    # Realistic scenario: blocks.schema.ts exists but has no block schemas yet
    content = '''import { z } from 'zod';
import { BaseSchema } from './base.schema';

export * from './base.schema';

export const TutorialBlockSchema: z.ZodType<any> = z.lazy(() =>
  z.union([])
);'''
    
    patched = patch_blocks_schema(
        content,
        schema_filename="objective-o1.schema.ts",
        schema_export_name="ObjectiveO1BlockSchema"
    )
    
    assert "import { ObjectiveO1BlockSchema } from './objective-o1.schema';" in patched
    assert "export * from './objective-o1.schema';" in patched
    assert "ObjectiveO1BlockSchema," in patched


def test_patch_blocks_schema_idempotent():
    """Test calling twice produces same result."""
    content = '''import { z } from 'zod';
import { CodeC1BlockSchema } from './code-c1.schema';

export * from './code-c1.schema';

export const TutorialBlockSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    CodeC1BlockSchema,
  ])
);'''
    
    patched_once = patch_blocks_schema(
        content,
        schema_filename="objective-o1.schema.ts",
        schema_export_name="ObjectiveO1BlockSchema"
    )
    
    patched_twice = patch_blocks_schema(
        patched_once,
        schema_filename="objective-o1.schema.ts",
        schema_export_name="ObjectiveO1BlockSchema"
    )
    
    assert patched_once == patched_twice


def test_patch_blocks_schema_preserves_existing():
    """Test existing schemas not removed."""
    content = '''import { z } from 'zod';
import { CodeC1BlockSchema } from './code-c1.schema';
import { IntroductionI1BlockSchema } from './introduction-i1.schema';

export * from './code-c1.schema';
export * from './introduction-i1.schema';

export const TutorialBlockSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    CodeC1BlockSchema,
    IntroductionI1BlockSchema,
  ])
);'''
    
    patched = patch_blocks_schema(
        content,
        schema_filename="objective-o1.schema.ts",
        schema_export_name="ObjectiveO1BlockSchema"
    )
    
    assert "CodeC1BlockSchema" in patched
    assert "IntroductionI1BlockSchema" in patched
    assert "ObjectiveO1BlockSchema" in patched


def test_patch_blocks_schema_fails_on_missing_union():
    """Test fail-closed when TutorialBlockSchema not found."""
    content = '''import { z } from 'zod';

// No TutorialBlockSchema here
'''
    
    with pytest.raises(PatchError, match="Cannot find schema import section"):
        patch_blocks_schema(
            content,
            schema_filename="objective-o1.schema.ts",
            schema_export_name="ObjectiveO1BlockSchema"
        )


def test_patch_blocks_schema_substring_safety():
    """Test that similar schema names don't cause false positives."""
    content = '''import { z } from 'zod';
import { ObjectiveBlockSchema } from './objective.schema';

export * from './objective.schema';

export const TutorialBlockSchema: z.ZodType<any> = z.lazy(() =>
  z.union([
    ObjectiveBlockSchema,
  ])
);'''
    
    # Should add ObjectiveO1BlockSchema without thinking ObjectiveBlockSchema is a match
    patched = patch_blocks_schema(
        content,
        schema_filename="objective-o1.schema.ts",
        schema_export_name="ObjectiveO1BlockSchema"
    )
    
    assert "ObjectiveBlockSchema" in patched  # Original preserved
    assert "ObjectiveO1BlockSchema" in patched  # New one added
    # Count exact occurrences in union array
    assert "ObjectiveBlockSchema," in patched
    assert "ObjectiveO1BlockSchema," in patched


def test_derive_file_operations_rejects_types_ts_extension(tmp_path):
    """Test that .types.ts extension is rejected (must use .schema.ts)."""
    comparator = CanonicalComparator(snapshot={})
    with pytest.raises(ValueError, match=r"uses \.types\.ts extension.*must use \.schema\.ts"):
        comparator.derive_file_operations(
            files=[
                {"filename": "ObjectiveO1Block.tsx", "content": "export function ObjectiveO1Block() {}"},
                {"filename": "ObjectiveO1Block.test.tsx", "content": "test('renders', () => {})"},
                {"filename": "objective-o1.schema.json", "content": "{}"},
                {"filename": "objective-o1.types.ts", "content": "export interface ObjectiveO1BlockContract {}"},
                {"filename": "block.integration.json", "content": '{"family":"Objective","version":"O1","typeId":"objective","componentFile":"ObjectiveO1Block.tsx","componentExport":"ObjectiveO1Block","testFile":"ObjectiveO1Block.test.tsx","jsonSchemaFile":"objective-o1.schema.json","typeSchemaFile":"objective-o1.types.ts","defaultPayload":{"title":"Example","objectives":[]}}'},
            ],
            family=BlockFamily.OBJECTIVE,
            version="O1",
            workspace_root=tmp_path,
        )


def test_derive_file_operations_rejects_interface_only_schema(tmp_path):
    """Test that interface-only schema files are rejected (must export Zod schema)."""
    comparator = CanonicalComparator(snapshot={})
    with pytest.raises(ValueError, match="must export runtime Zod schema.*Interface-only"):
        comparator.derive_file_operations(
            files=[
                {"filename": "ObjectiveO1Block.tsx", "content": "export function ObjectiveO1Block() {}"},
                {"filename": "ObjectiveO1Block.test.tsx", "content": "test('renders', () => {})"},
                {"filename": "objective-o1.schema.json", "content": "{}"},
                {"filename": "objective-o1.schema.ts", "content": "export interface ObjectiveO1BlockSchema { id: string; type: string; }"},
                {"filename": "block.integration.json", "content": '{"family":"Objective","version":"O1","typeId":"objective","componentFile":"ObjectiveO1Block.tsx","componentExport":"ObjectiveO1Block","testFile":"ObjectiveO1Block.test.tsx","jsonSchemaFile":"objective-o1.schema.json","typeSchemaFile":"objective-o1.schema.ts","schemaExport":"ObjectiveO1BlockSchema","defaultPayload":{"title":"Example","objectives":[]}}'},
            ],
            family=BlockFamily.OBJECTIVE,
            version="O1",
            workspace_root=tmp_path,
        )


def test_derive_file_operations_accepts_valid_zod_schema(tmp_path):
    """Test that valid Zod schema export passes validation."""
    renderer_rel = "packages/ui/src/tutorial/generatedBlockRenderers.tsx"
    generated_registry_rel = "apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/generatedBlockRegistries.ts"
    blocks_schema_rel = "packages/types/src/tutorial-rich-document/schemas/blocks.schema.ts"
    composer_definitions_rel = "apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/generatedBlockVersionDefinitions.ts"

    renderer_file = tmp_path / renderer_rel
    renderer_file.parent.mkdir(parents=True, exist_ok=True)
    renderer_file.write_text("export const GENERATED_BLOCK_RENDERERS = [];\n", encoding='utf-8')

    generated_registry_file = tmp_path / generated_registry_rel
    generated_registry_file.parent.mkdir(parents=True, exist_ok=True)
    generated_registry_file.write_text("export const GENERATED_BLOCK_REGISTRIES = [];\n", encoding='utf-8')

    blocks_schema_file = tmp_path / blocks_schema_rel
    blocks_schema_file.parent.mkdir(parents=True, exist_ok=True)
    blocks_schema_file.write_text("import { z } from 'zod';\nexport const TutorialBlockSchema: z.ZodType<any> = z.lazy(() => z.union([]));\n", encoding='utf-8')

    composer_definitions_file = tmp_path / composer_definitions_rel
    composer_definitions_file.parent.mkdir(parents=True, exist_ok=True)
    composer_definitions_file.write_text("export const GENERATED_BLOCK_VERSION_DEFINITIONS = [];\n", encoding='utf-8')

    comparator = CanonicalComparator(snapshot={})
    
    # Valid Zod schema with proper export
    ops = comparator.derive_file_operations(
        files=[
            {"filename": "ObjectiveO1Block.tsx", "content": "export function ObjectiveO1Block() {}"},
            {"filename": "ObjectiveO1Block.test.tsx", "content": "test('renders', () => {})"},
            {"filename": "objective-o1.schema.json", "content": "{}"},
            {"filename": "objective-o1.schema.ts", "content": "import { z } from 'zod';\nexport const ObjectiveO1BlockSchema = z.object({ id: z.string(), type: z.literal('objective') });"},
            {"filename": "block.integration.json", "content": '{"family":"Objective","version":"O1","typeId":"objective","componentFile":"ObjectiveO1Block.tsx","componentExport":"ObjectiveO1Block","testFile":"ObjectiveO1Block.test.tsx","jsonSchemaFile":"objective-o1.schema.json","typeSchemaFile":"objective-o1.schema.ts","schemaExport":"ObjectiveO1BlockSchema","defaultPayload":{"title":"Example","objectives":[]}}'},
        ],
        family=BlockFamily.OBJECTIVE,
        version="O1",
        workspace_root=tmp_path,
    )
    
    # Should complete without error and include schema file operation
    schema_ops = [op for op in ops if op.source_filename == "objective-o1.schema.ts"]
    assert len(schema_ops) == 1
    assert schema_ops[0].action == PlacementFileAction.CREATE


def test_derive_file_operations_rejects_path_traversal_filename(tmp_path):
    """Test that filenames with path traversal attempts are rejected."""
    comparator = CanonicalComparator(snapshot={})
    with pytest.raises(ValueError, match="Unsafe filename detected"):
        comparator.derive_file_operations(
            files=[
                {"filename": "../../../etc/passwd", "content": "malicious"},
                {"filename": "block.integration.json", "content": '{"family":"Objective","version":"O1","typeId":"objective","componentFile":"ObjectiveO1Block.tsx","componentExport":"ObjectiveO1Block","testFile":"ObjectiveO1Block.test.tsx","jsonSchemaFile":"objective-o1.schema.json","typeSchemaFile":"objective-o1.schema.ts","defaultPayload":{"title":"Example","objectives":[]}}'},
            ],
            family=BlockFamily.OBJECTIVE,
            version="O1",
            workspace_root=tmp_path,
        )


def test_derive_file_operations_rejects_absolute_path_filename(tmp_path):
    """Test that absolute path filenames are rejected."""
    comparator = CanonicalComparator(snapshot={})
    with pytest.raises(ValueError, match="Unsafe filename detected"):
        comparator.derive_file_operations(
            files=[
                {"filename": "/etc/passwd", "content": "malicious"},
                {"filename": "block.integration.json", "content": '{"family":"Objective","version":"O1","typeId":"objective","componentFile":"ObjectiveO1Block.tsx","componentExport":"ObjectiveO1Block","testFile":"ObjectiveO1Block.test.tsx","jsonSchemaFile":"objective-o1.schema.json","typeSchemaFile":"objective-o1.schema.ts","defaultPayload":{"title":"Example","objectives":[]}}'},
            ],
            family=BlockFamily.OBJECTIVE,
            version="O1",
            workspace_root=tmp_path,
        )


def test_derive_file_operations_rejects_windows_path_traversal(tmp_path):
    """Test that Windows-style path traversal is rejected."""
    comparator = CanonicalComparator(snapshot={})
    with pytest.raises(ValueError, match="Unsafe filename detected"):
        comparator.derive_file_operations(
            files=[
                {"filename": "..\\..\\windows\\system32\\config", "content": "malicious"},
                {"filename": "block.integration.json", "content": '{"family":"Objective","version":"O1","typeId":"objective","componentFile":"ObjectiveO1Block.tsx","componentExport":"ObjectiveO1Block","testFile":"ObjectiveO1Block.test.tsx","jsonSchemaFile":"objective-o1.schema.json","typeSchemaFile":"objective-o1.schema.ts","defaultPayload":{"title":"Example","objectives":[]}}'},
            ],
            family=BlockFamily.OBJECTIVE,
            version="O1",
            workspace_root=tmp_path,
        )


def test_derive_file_operations_rejects_hidden_files(tmp_path):
    """Test that non-allowed hidden files are rejected."""
    comparator = CanonicalComparator(snapshot={})
    with pytest.raises(ValueError, match="Hidden file not allowed"):
        comparator.derive_file_operations(
            files=[
                {"filename": ".env", "content": "SECRET_KEY=12345"},
                {"filename": "block.integration.json", "content": '{"family":"Objective","version":"O1","typeId":"objective","componentFile":"ObjectiveO1Block.tsx","componentExport":"ObjectiveO1Block","testFile":"ObjectiveO1Block.test.tsx","jsonSchemaFile":"objective-o1.schema.json","typeSchemaFile":"objective-o1.schema.ts","defaultPayload":{"title":"Example","objectives":[]}}'},
            ],
            family=BlockFamily.OBJECTIVE,
            version="O1",
            workspace_root=tmp_path,
        )


def test_derive_file_operations_rejects_missing_schema_export_metadata(tmp_path):
    """Test that schemaExport is now REQUIRED when typeSchemaFile is provided."""
    renderer_rel = "packages/ui/src/tutorial/generatedBlockRenderers.tsx"
    generated_registry_rel = "apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/registry/generatedBlockRegistries.ts"
    blocks_schema_rel = "packages/types/src/tutorial-rich-document/schemas/blocks.schema.ts"
    composer_definitions_rel = "apps/skillhubcore-admin/src/app/(admin)/tools/tutorial-page-content/document/generatedBlockVersionDefinitions.ts"

    renderer_file = tmp_path / renderer_rel
    renderer_file.parent.mkdir(parents=True, exist_ok=True)
    renderer_file.write_text("export const GENERATED_BLOCK_RENDERERS = [];\n", encoding='utf-8')

    generated_registry_file = tmp_path / generated_registry_rel
    generated_registry_file.parent.mkdir(parents=True, exist_ok=True)
    generated_registry_file.write_text("export const GENERATED_BLOCK_REGISTRIES = [];\n", encoding='utf-8')

    blocks_schema_file = tmp_path / blocks_schema_rel
    blocks_schema_file.parent.mkdir(parents=True, exist_ok=True)
    blocks_schema_file.write_text("import { z } from 'zod';\nexport const TutorialBlockSchema: z.ZodType<any> = z.lazy(() => z.union([]));\n", encoding='utf-8')

    composer_definitions_file = tmp_path / composer_definitions_rel
    composer_definitions_file.parent.mkdir(parents=True, exist_ok=True)
    composer_definitions_file.write_text("export const GENERATED_BLOCK_VERSION_DEFINITIONS = [];\n", encoding='utf-8')

    comparator = CanonicalComparator(snapshot={})
    
    # Integration metadata without schemaExport should now be REJECTED (schemaExport is mandatory)
    with pytest.raises(ValueError, match="must include 'schemaExport' when 'typeSchemaFile' is provided"):
        comparator.derive_file_operations(
            files=[
                {"filename": "ObjectiveO1Block.tsx", "content": "export function ObjectiveO1Block() {}"},
                {"filename": "ObjectiveO1Block.test.tsx", "content": "test('renders', () => {})"},
                {"filename": "objective-o1.schema.json", "content": "{}"},
                {"filename": "objective-o1.schema.ts", "content": "export const SomeSchema = z.object({ id: z.string() });"},
                {"filename": "block.integration.json", "content": '{"family":"Objective","version":"O1","typeId":"objective","componentFile":"ObjectiveO1Block.tsx","componentExport":"ObjectiveO1Block","testFile":"ObjectiveO1Block.test.tsx","jsonSchemaFile":"objective-o1.schema.json","typeSchemaFile":"objective-o1.schema.ts","defaultPayload":{"title":"Example","objectives":[]}}'},
            ],
            family=BlockFamily.OBJECTIVE,
            version="O1",
            workspace_root=tmp_path,
        )

