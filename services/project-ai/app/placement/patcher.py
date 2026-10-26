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
    Surgically insert a component import and switch-case branch into TutorialBlockRenderer.tsx.
    
    Invariants:
    1. If the block component is already imported or handled, fail or keep idempotent.
    2. Import is added with other block imports (before helper functions).
    3. Switch-case is inserted before the `default:` branch.
    """
    block_type = family.lower()
    version_upper = version.upper()
    import_statement = f"import {{ {component_name} }} from './blocks/{component_name}';"

    # 1. Insert import after the last block import
    # Look for last import from './blocks/...'
    block_import_pattern = r"(import\s+\{[^}]+\}\s+from\s+'\./blocks/[^']+';(?:\r?\n))"
    matches = list(re.finditer(block_import_pattern, content))
    if not matches:
        raise PatchError("Cannot find block import section in TutorialBlockRenderer.tsx")
    
    if import_statement in content:
        patched_content = content
    else:
        last_match = matches[-1]
        insert_pos = last_match.end()
        patched_content = content[:insert_pos] + import_statement + "\n" + content[insert_pos:]

    case_match = re.search(
        rf"(?P<indent>[ \t]*)case\s+'{re.escape(block_type)}':\s*\{{",
        patched_content,
    )
    if case_match:
        # Locate the full family branch by balancing braces. A regex ending at the
        # outer switch's `default` breaks after the second version introduces its
        # own nested switch/default branch.
        opening_brace = patched_content.find("{", case_match.start(), case_match.end())
        depth = 0
        closing_brace = None
        for index in range(opening_brace, len(patched_content)):
            if patched_content[index] == "{":
                depth += 1
            elif patched_content[index] == "}":
                depth -= 1
                if depth == 0:
                    closing_brace = index
                    break
        if closing_brace is None:
            raise PatchError(f"Cannot find the end of the existing {family} renderer branch")

        body = patched_content[opening_brace + 1:closing_brace]
        existing_versions = re.findall(
            r"case\s+'([^']+)':\s*\n\s*return\s+<([A-Za-z0-9_]+)\s+block=",
            body,
        )
        if not existing_versions:
            prior_version = re.search(r"version\s*!==\s*['\"]([^'\"]+)['\"]", body)
            prior_component = re.search(r"return\s+<([A-Za-z0-9_]+)\s+block=", body)
            if not prior_version or not prior_component:
                raise PatchError(
                    f"Cannot safely extend existing {family} renderer branch; expected a version guard and component return"
                )
            existing_versions = [(prior_version.group(1), prior_component.group(1))]

        if any(existing_version == version_upper for existing_version, _ in existing_versions):
            return patched_content
        existing_versions.append((version_upper, component_name))

        indent = case_match.group("indent")
        version_cases = "".join(
            f"{indent}    case '{existing_version}':\n"
            f"{indent}      return <{existing_component} block={{block as any}} depth={{depth}} theme={{theme}} className={{className}} runtimeContext={{runtimeContext}} renderChild={{renderChild}} />;\n"
            for existing_version, existing_component in existing_versions
        )
        branch = (
            f"{indent}case '{block_type}': {{\n"
            f"{indent}  const {block_type}Version = 'version' in block ? (block as any).version : undefined;\n"
            f"{indent}  switch ({block_type}Version) {{\n"
            f"{version_cases}"
            f"{indent}    default:\n"
            f"{indent}      throw new Error(`Unsupported {family} version: ${{String({block_type}Version)}}`);\n"
            f"{indent}  }}\n"
            f"{indent}}}"
        )
        return patched_content[:case_match.start()] + branch + patched_content[closing_brace + 1:]

    # 2. Insert switch case before 'default:'
    switch_branch = (
        f"      case '{block_type}': {{\n"
        f"        if (!('version' in block) || (block as any).version !== '{version_upper}') {{\n"
        f"          throw new Error(\n"
        f"            `Unsupported {family} version. {version_upper} is required. Received: ${{('version' in block) ? (block as any).version : 'no version'}}`\n"
        f"          );\n"
        f"        }}\n"
        f"        return <{component_name} block={{block as any}} depth={{depth}} theme={{theme}} className={{className}} runtimeContext={{runtimeContext}} renderChild={{renderChild}} />;\n"
        f"      }}\n"
    )

    default_case_pattern = r"(\r?\n\s+default:\s*\{)"
    default_match = re.search(default_case_pattern, patched_content)
    if not default_match:
        raise PatchError("Cannot find 'default:' branch in TutorialBlockRenderer.tsx switch statement")
    
    insert_pos_switch = default_match.start()
    final_content = patched_content[:insert_pos_switch] + "\n" + switch_branch + patched_content[insert_pos_switch:]
    return final_content


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
