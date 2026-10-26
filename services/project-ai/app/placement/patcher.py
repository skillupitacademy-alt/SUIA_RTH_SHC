"""Safe, deterministic TypeScript code patchers for canonical repository targets.

All patchers operate with strict pre-condition checks, idempotent guarantees,
and fail-closed invariants.
"""

import hashlib
import json
import re
from typing import Tuple


class PatchError(Exception):
    """Raised when a patch cannot be safely or deterministically applied."""
    pass


def compute_sha256(content: str | bytes) -> str:
    """Compute SHA-256 with normalized newlines to ensure cross-platform determinism."""
    if isinstance(content, bytes):
        content = content.decode('utf-8', errors='replace')
    normalized = content.replace('\r\n', '\n')
    return hashlib.sha256(normalized.encode('utf-8')).hexdigest()


def patch_tutorial_block_renderer(
    content: str,
    family: str,
    version: str,
    component_name: str
) -> str:
    """
    Register a generated component in the declarative renderer table.

    The target is generatedBlockRenderers.tsx, deliberately kept as an append-only
    Project LLM patch surface. This avoids parsing or rewriting the runtime renderer.
    """
    block_type = family.lower()
    version_upper = version.upper()
    import_statement = f"import {{ {component_name} }} from './blocks/{component_name}';"
    entry = (
        f"  {{ family: '{block_type}', version: '{version_upper}', component: {component_name} }},"
    )

    if entry in content:
        return content

    # Keep imports deterministic and adjacent to the generated renderer contract.
    block_import_pattern = r"(import\s+\{[^}]+\}\s+from\s+'\./blocks/[^']+';(?:\r?\n))"
    matches = list(re.finditer(block_import_pattern, content))
    if matches:
        if import_statement in content:
            patched_content = content
        else:
            insert_pos = matches[-1].end()
            patched_content = content[:insert_pos] + import_statement + "\n" + content[insert_pos:]
    else:
        # The generated file starts with type-only imports, so insert the first
        # value import immediately before the exported registration interface.
        interface_match = re.search(r"export\s+interface\s+GeneratedBlockRenderer", content)
        if not interface_match:
            raise PatchError("Cannot find GeneratedBlockRenderer declaration")
        patched_content = content[:interface_match.start()] + import_statement + "\n" + content[interface_match.start():]

    marker = "  // PROJECT_LLM_GENERATED_RENDERERS"
    if marker not in patched_content:
        raise PatchError("Cannot find PROJECT_LLM_GENERATED_RENDERERS marker")
    return patched_content.replace(marker, f"{entry}\n{marker}", 1)


def patch_tutorial_composer_registry(
    content: str,
    family: str,
    registry_export_name: str
) -> str:
    """
    Surgically insert registry entry import and getBlockTypes() registration into registry/index.ts.
    
    Invariants:
    1. If registry is already registered, fail or keep idempotent.
    2. Import is added with other entry imports.
    3. Entry is added to getBlockTypes() array.
    """
    file_stem = family.lower()
    import_statement = f"import {{ {registry_export_name} }} from './entries/{file_stem}.registry';"

    # Idempotency check
    if import_statement in content and registry_export_name in content:
        return content

    # 1. Insert import after the last entry import
    entry_import_pattern = r"(import\s+\{[^}]+\}\s+from\s+'\./entries/[^']+';(?:\r?\n))"
    matches = list(re.finditer(entry_import_pattern, content))
    if not matches:
        raise PatchError("Cannot find registry entries import section in registry/index.ts")
    
    last_match = matches[-1]
    insert_pos = last_match.end()
    patched_content = content[:insert_pos] + import_statement + "\n" + content[insert_pos:]

    # 2. Insert into getBlockTypes() array: return [ ... ];
    get_blocks_pattern = r"(export\s+function\s+getBlockTypes\(\):\s*BlockRegistryEntry\[\]\s*\{\s*return\s*\[)([\s\S]*?)(\];)"
    match = re.search(get_blocks_pattern, patched_content)
    if not match:
        raise PatchError("Cannot find getBlockTypes() array in registry/index.ts")

    array_prefix = match.group(1)
    array_body = match.group(2)
    array_suffix = match.group(3)

    # Determine indentation
    new_array_body = array_body.rstrip() + f"\n    {registry_export_name},\n  "
    replacement = array_prefix + new_array_body + array_suffix
    
    final_content = patched_content[:match.start()] + replacement + patched_content[match.end():]
    return final_content


def patch_family_registry(
    content: str,
    family: str,
    version: str,
    metadata: dict,
) -> str:
    """Append one version to a family registry without replacing existing versions."""
    version_upper = version.upper()
    if re.search(rf"\bcode:\s*['\"]{re.escape(version_upper)}['\"]", content):
        return content

    versions_match = re.search(r"versions\s*:\s*\[", content)
    if not versions_match:
        raise PatchError("Cannot find versions array in family registry")

    depth = 1
    index = versions_match.end()
    while index < len(content) and depth:
        if content[index] == "[":
            depth += 1
        elif content[index] == "]":
            depth -= 1
        index += 1
    if depth:
        raise PatchError("Cannot find end of versions array in family registry")

    payload = metadata.get("defaultPayload", {})
    if not isinstance(payload, dict):
        raise PatchError("block.integration.json defaultPayload must be an object")
    payload_json = json.dumps(payload, indent=8, ensure_ascii=True)
    entry = f"""
    {{
      id: '{metadata.get('registryVersionId') or version_upper.lower()}',
      code: '{version_upper}',
      label: {json.dumps(metadata.get('label') or f'{version_upper} - {family}')},
      description: {json.dumps(metadata.get('description') or f'{family} block version {version_upper}')},
      getDefaultPayload: () => ({payload_json}),
    }},"""
    return content[:index - 1].rstrip() + entry + "\n  " + content[index - 1:]


def create_family_registry(family: str, version: str, metadata: dict) -> str:
    """Create a registry only when the block family is genuinely new."""
    family_lower = family.lower()
    registry_name = f"{family_lower}Registry"
    payload = metadata.get("defaultPayload", {})
    if not isinstance(payload, dict):
        raise PatchError("block.integration.json defaultPayload must be an object")
    payload_json = json.dumps(payload, indent=8, ensure_ascii=True)
    return f"""import type {{ BlockRegistryEntry }} from '../types';

export const {registry_name}: BlockRegistryEntry = {{
  id: '{family_lower}',
  label: {json.dumps(family)},
  versions: [
    {{
      id: '{metadata.get('registryVersionId') or version.lower()}',
      code: '{version.upper()}',
      label: {json.dumps(metadata.get('label') or f'{version.upper()} - {family}')},
      description: {json.dumps(metadata.get('description') or f'{family} block version {version.upper()}')},
      getDefaultPayload: () => ({payload_json}),
    }},
  ],
}};
"""


def patch_tutorial_page_content_types(
    content: str,
    family_type_id: str
) -> str:
    """
    Surgically append family_type_id to TutorialPageContentType union in tutorial-page-content.types.ts.
    
    Example:
    export type TutorialPageContentType = 'definition' | 'code' | 'summary' | 'introduction';
    ->
    export type TutorialPageContentType = 'definition' | 'code' | 'summary' | 'introduction' | 'objective';
    """
    pattern = r"(export\s+type\s+TutorialPageContentType\s*=\s*)([^;]+)(;)"
    match = re.search(pattern, content)
    if not match:
        raise PatchError("Cannot find TutorialPageContentType definition in tutorial-page-content.types.ts")
    
    current_union = match.group(2)
    quoted_id = f"'{family_type_id.lower()}'"
    if quoted_id in current_union:
        # Already included
        return content

    new_union = current_union.strip() + f" | {quoted_id}"
    return content[:match.start()] + match.group(1) + new_union + match.group(3) + content[match.end():]


def patch_generated_block_version_definitions(
    content: str,
    family_type_id: str,
    version: str,
    payload_format: str = "canonical",
) -> str:
    """Append an approved family/version to the Composer adapter registry."""
    if payload_format not in {"legacy", "canonical"}:
        raise PatchError("payloadFormat must be either 'legacy' or 'canonical'")

    version_upper = version.upper()
    if re.search(
        rf"type:\s*['\"]{re.escape(family_type_id.lower())}['\"].*?version:\s*['\"]{re.escape(version_upper)}['\"]",
        content,
        re.DOTALL,
    ):
        return content

    marker = "  // PROJECT_LLM_GENERATED_DEFINITIONS"
    if marker not in content:
        raise PatchError("Cannot find Project LLM generated-definition marker")
    entry = (
        f"  {{ type: '{family_type_id.lower()}', version: '{version_upper}', "
        f"payloadFormat: '{payload_format}' }},\n"
    )
    return content.replace(marker, entry + marker, 1)


def patch_generated_block_registry(
    content: str,
    family: str,
    version: str,
    metadata: dict,
) -> str:
    """Append generated Composer metadata to its dedicated, marker-based catalog."""
    family_lower = family.lower()
    version_upper = version.upper()
    payload = metadata.get("defaultPayload", {})
    if not isinstance(payload, dict) or not payload:
        raise PatchError("block.integration.json defaultPayload must be a non-empty object")

    existing_pattern = (
        rf"id:\s*['\"]{re.escape(family_lower)}['\"][\s\S]*?"
        rf"code:\s*['\"]{re.escape(version_upper)}['\"]"
    )
    if re.search(existing_pattern, content):
        return content

    marker = "  // PROJECT_LLM_GENERATED_REGISTRIES"
    if marker not in content:
        raise PatchError("Cannot find Project LLM generated-registry marker")

    payload_json = json.dumps(payload, indent=10, ensure_ascii=True)
    entry = f'''  {{
    id: '{family_lower}',
    label: {json.dumps(metadata.get("familyLabel") or family)},
    versions: [
      {{
        id: {json.dumps(metadata.get("registryVersionId") or version_upper.lower())},
        code: '{version_upper}',
        label: {json.dumps(metadata.get("label") or f"{version_upper} - {family}")},
        description: {json.dumps(metadata.get("description") or f"{family} block version {version_upper}")},
        getDefaultPayload: () => ({payload_json}),
      }},
    ],
  }},
'''
    return content.replace(marker, entry + marker, 1)
