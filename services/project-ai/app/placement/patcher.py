"""Safe, deterministic TypeScript code patchers for canonical repository targets.

All patchers operate with strict pre-condition checks, idempotent guarantees,
and fail-closed invariants.
"""

import hashlib
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

    # Idempotency check
    if import_statement in content or f"case '{block_type}':" in content:
        raise PatchError(f"Block '{block_type}' is already present in TutorialBlockRenderer.tsx")

    # 1. Insert import after the last block import
    # Look for last import from './blocks/...'
    block_import_pattern = r"(import\s+\{[^}]+\}\s+from\s+'\./blocks/[^']+';(?:\r?\n))"
    matches = list(re.finditer(block_import_pattern, content))
    if not matches:
        raise PatchError("Cannot find block import section in TutorialBlockRenderer.tsx")
    
    last_match = matches[-1]
    insert_pos = last_match.end()
    patched_content = content[:insert_pos] + import_statement + "\n" + content[insert_pos:]

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
    if import_statement in content or registry_export_name in content:
        raise PatchError(f"Registry entry '{registry_export_name}' is already present in registry/index.ts")

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
