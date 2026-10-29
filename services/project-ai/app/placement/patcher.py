"""Safe, deterministic TypeScript code patchers for canonical repository targets.

All patchers operate with strict pre-condition checks, idempotent guarantees,
duplicate detection, and fail-closed invariants.
"""

import hashlib
import json
import re
from typing import Optional


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

    Keyed by normalized pair (family, version).
    - If duplicate entries exist for (family, version), fails closed.
    - If 1 entry exists (UPDATE_IN_PLACE), updates component binding in place.
    - If 0 entries exist (ADD_NEW_VERSION), appends exactly one new entry.
    """
    block_type = family.lower().strip()
    version_upper = version.upper().strip()
    import_statement = f"import {{ {component_name} }} from './blocks/{component_name}';"
    entry = (
        f"  {{ family: '{block_type}', version: '{version_upper}', component: {component_name} }},"
    )

    # Ensure component import is present
    patched_content = content
    if import_statement not in patched_content:
        block_import_pattern = r"(import\s+\{[^}]+\}\s+from\s+'\./blocks/[^']+';(?:\r?\n))"
        matches = list(re.finditer(block_import_pattern, patched_content))
        if matches:
            insert_pos = matches[-1].end()
            patched_content = patched_content[:insert_pos] + import_statement + "\n" + patched_content[insert_pos:]
        else:
            interface_match = re.search(r"export\s+interface\s+GeneratedBlockRenderer", patched_content)
            if not interface_match:
                raise PatchError("Cannot find GeneratedBlockRenderer declaration")
            patched_content = patched_content[:interface_match.start()] + import_statement + "\n" + patched_content[interface_match.start():]

    # Detect duplicates on updated content
    existing_pattern = r"\{\s*family:\s*['\"]" + re.escape(block_type) + r"['\"],\s*version:\s*['\"]" + re.escape(version_upper) + r"['\"].*?\}"
    existing_matches = list(re.finditer(existing_pattern, patched_content, re.IGNORECASE))
    if len(existing_matches) > 1:
        raise PatchError(f"Duplicate renderer entry detected for ({block_type}, {version_upper})")

    # If exactly 1 entry exists, update it in place
    if len(existing_matches) == 1:
        m = existing_matches[0]
        if m.group(0).strip() == entry.strip():
            return patched_content
        return patched_content[:m.start()] + entry + patched_content[m.end():]

    # If 0 entries exist, append before marker
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
    1. If registry is already registered, keep idempotent.
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
      id: '{version_upper.lower()}',
      code: '{version_upper}',
      label: '{version_upper} - {family}',
      description: '{family} block version {version_upper}',
      getDefaultPayload: () => ({payload_json}),
    }},"""
    insert_at = index - 1
    return content[:insert_at] + entry + "\n  " + content[insert_at:]




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
    Add new family type to TutorialPageContentType union in tutorial-page-content.types.ts.
    
    Pattern:
    export type TutorialPageContentType = 'definition' | 'code' | ... ;
    """
    pattern = r"(export\s+type\s+TutorialPageContentType\s*=\s*)([^;]+)(;)"
    match = re.search(pattern, content)
    if not match:
        raise PatchError("Cannot find TutorialPageContentType definition in tutorial-page-content.types.ts")
    
    current_union = match.group(2)
    quoted_id = f"'{family_type_id.lower()}'"
    if quoted_id in current_union:
        return content

    new_union = current_union.strip() + f" | {quoted_id}"
    return content[:match.start()] + match.group(1) + new_union + match.group(3) + content[match.end():]


def patch_generated_block_version_definitions(
    content: str,
    family_type_id: str,
    version: str,
    payload_format: str = "canonical",
) -> str:
    """
    Append or update an approved family/version in the Composer adapter registry.

    Keyed by normalized pair (family, version).
    - If duplicate entries exist, fails closed.
    - If 1 entry exists (UPDATE_IN_PLACE), updates payloadFormat in place.
    - If 0 entries exist (ADD_NEW_VERSION), appends exactly one new entry.
    """
    if payload_format not in {"legacy", "canonical"}:
        raise PatchError("payloadFormat must be either 'legacy' or 'canonical'")

    type_norm = family_type_id.lower().strip()
    version_upper = version.upper().strip()

    pattern = r"\{\s*type:\s*['\"]" + re.escape(type_norm) + r"['\"],\s*version:\s*['\"]" + re.escape(version_upper) + r"['\"].*?\}"
    existing_matches = list(re.finditer(pattern, content, re.IGNORECASE))
    if len(existing_matches) > 1:
        raise PatchError(f"Duplicate block version definition detected for ({type_norm}, {version_upper})")

    entry = (
        f"  {{ type: '{type_norm}', version: '{version_upper}', "
        f"payloadFormat: '{payload_format}' }},"
    )

    if len(existing_matches) == 1:
        m = existing_matches[0]
        return content[:m.start()] + entry + content[m.end():]

    marker = "  // PROJECT_LLM_GENERATED_DEFINITIONS"
    if marker not in content:
        raise PatchError("Cannot find Project LLM generated-definition marker")
    return content.replace(marker, f"{entry}\n{marker}", 1)


def _find_matching_delimiter(text: str, open_idx: int, open_ch: str, close_ch: str) -> int:
    """Find the index of the balanced closing delimiter, ignoring delimiters inside string literals."""
    depth = 0
    in_str: Optional[str] = None
    escaped = False
    for idx in range(open_idx, len(text)):
        ch = text[idx]
        if in_str:
            if escaped:
                escaped = False
            elif ch == "\\":
                escaped = True
            elif ch == in_str:
                in_str = None
            continue
        if ch in ("'", '"', "`"):
            in_str = ch
            continue
        if ch == open_ch:
            depth += 1
        elif ch == close_ch:
            depth -= 1
            if depth == 0:
                return idx
    raise PatchError(f"Unbalanced delimiter '{open_ch}{close_ch}' starting at index {open_idx}")


def _find_family_versions_spans(content: str, family_lower: str) -> list[tuple[int, int]]:
    """
    Return (inner_start, inner_end) spans for `versions: [ ... ]` of the given family.
    Uses balanced bracket scanning so inner arrays in getDefaultPayload do not truncate the match.
    """
    spans: list[tuple[int, int]] = []
    # Match family-level `id: '<family>'` followed shortly by `label:` and `versions: [`
    family_header_pattern = rf"id:\s*['\"]{re.escape(family_lower)}['\"]\s*,\s*label:\s*[^\n]+,\s*versions:\s*\["
    for m in re.finditer(family_header_pattern, content, re.IGNORECASE):
        open_bracket_idx = m.end() - 1
        close_bracket_idx = _find_matching_delimiter(content, open_bracket_idx, "[", "]")
        spans.append((open_bracket_idx + 1, close_bracket_idx))
    return spans


def patch_generated_block_registry(
    content: str,
    family: str,
    version: str,
    metadata: dict,
) -> str:
    """
    Append or update generated Composer metadata in its dedicated catalog.

    Keyed by normalized pair (family, version).
    - If duplicate entries exist for (family, version), fails closed.
    - If version exists in family (UPDATE_IN_PLACE), updates label, description, and payload in place.
    - If family exists but version does not, appends version to family's versions array.
    - If family does not exist, appends whole family with version before marker.
    """
    family_lower = family.lower().strip()
    version_upper = version.upper().strip()
    payload = metadata.get("defaultPayload", {})
    if not isinstance(payload, dict) or not payload:
        raise PatchError("block.integration.json defaultPayload must be a non-empty object")

    payload_json = json.dumps(payload, indent=10, ensure_ascii=True)
    version_id = metadata.get("registryVersionId") or version_upper.lower()
    version_label = metadata.get("label") or f"{version_upper} - {family}"
    version_desc = metadata.get("description") or f"{family} block version {version_upper}"

    version_pattern = rf"code:\s*['\"]{re.escape(version_upper)}['\"]"

    version_object_code = f"""      {{
        id: {json.dumps(version_id)},
        code: '{version_upper}',
        label: {json.dumps(version_label)},
        description: {json.dumps(version_desc)},
        getDefaultPayload: () => ({payload_json}),
      }},"""

    # Check if this exact family exists, using balanced brackets for `versions: [...]`
    family_spans = _find_family_versions_spans(content, family_lower)
    if len(family_spans) > 1:
        raise PatchError(f"Duplicate family entry detected for family {family_lower}")

    if family_spans:
        v_start, v_end = family_spans[0]
        versions_inner = content[v_start:v_end]
        # Check for duplicate version entries ONLY within this family
        version_matches = list(re.finditer(version_pattern, versions_inner, re.IGNORECASE))
        if len(version_matches) > 1:
            raise PatchError(f"Duplicate registry version entry detected for ({family_lower}, {version_upper})")

        # Check if version exists inside this family
        if len(version_matches) == 1:
            # UPDATE_IN_PLACE: find the enclosing `{ ... },` of this version entry inside versions_inner
            match_pos = version_matches[0].start()
            obj_open = versions_inner.rfind("{", 0, match_pos)
            if obj_open != -1:
                obj_close = _find_matching_delimiter(versions_inner, obj_open, "{", "}")
                # Include trailing comma if present
                after_close = obj_close + 1
                while after_close < len(versions_inner) and versions_inner[after_close] in (" ", "\t"):
                    after_close += 1
                if after_close < len(versions_inner) and versions_inner[after_close] == ",":
                    after_close += 1
                updated_inner = (
                    versions_inner[:obj_open]
                    + version_object_code.strip()
                    + versions_inner[after_close:]
                )
                return content[:v_start] + updated_inner + content[v_end:]
            return content

        # Family exists, but version does not: append version into family's versions array
        stripped_inner = versions_inner.rstrip()
        if stripped_inner and not stripped_inner.endswith(","):
            stripped_inner += ","
        new_versions_inner = stripped_inner + "\n" + version_object_code + "\n    "
        return content[:v_start] + new_versions_inner + content[v_end:]

    # Family does not exist in generated registries: create family block with this version
    marker = "  // PROJECT_LLM_GENERATED_REGISTRIES"
    if marker not in content:
        raise PatchError("Cannot find Project LLM generated-registry marker")

    entry = f'''  {{
    id: '{family_lower}',
    label: {json.dumps(metadata.get("familyLabel") or family)},
    versions: [
{version_object_code}
    ],
  }},
'''
    return content.replace(marker, entry + marker, 1)
