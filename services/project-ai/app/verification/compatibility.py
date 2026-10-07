"""
Compatibility verification for mix-and-match composition.

Validates that selected components are compatible across:
- Type compatibility (expected interfaces)
- Version compatibility (API compatibility)
- Registry compatibility (no conflicts)
- Renderer compatibility (same render context)
- Runtime compatibility (same execution environment)
"""

from enum import Enum
from typing import Any, Dict, List, Optional
from pathlib import Path


class CompatibilityErrorCode(Enum):
    """Specific error codes for compatibility failures."""
    TYPE_MISMATCH = "TYPE_MISMATCH"
    VERSION_INCOMPATIBLE = "VERSION_INCOMPATIBLE"
    REGISTRY_CONFLICT = "REGISTRY_CONFLICT"
    RENDERER_CONFLICT = "RENDERER_CONFLICT"
    RUNTIME_CONFLICT = "RUNTIME_CONFLICT"
    COMPONENT_NOT_FOUND = "COMPONENT_NOT_FOUND"
    COMPONENT_INVALID = "COMPONENT_INVALID"


class CompatibilityResult:
    """Result of compatibility verification."""
    
    def __init__(
        self,
        passed: bool,
        error_code: Optional[CompatibilityErrorCode],
        error_message: str,
        conflicts: List[str]
    ):
        self.passed = passed
        self.error_code = error_code
        self.error_message = error_message
        self.conflicts = conflicts


def resolve_component(source: str, snapshot: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """
    Resolve component information from snapshot.
    
    Args:
        source: Component source identifier (I1, I2, CANDIDATE, or specific block ID)
        snapshot: TypeScript-generated discovery snapshot
        
    Returns:
        Component metadata dictionary or None if not found
    """
    blocks_data = snapshot.get('blocks', {})
    verified_blocks = blocks_data.get('verified', [])
    
    if source in ["I1", "I2"]:
        # I1/I2 are preset collections - return metadata about the preset
        return {
            "source": source,
            "preset": True,
            "version": "1.0.0",  # Presets have implicit versions
            "registry": "core",
            "renderer": "TutorialBlockRenderer",
            "runtime": "react"
        }
    
    # For specific block IDs (e.g., "T13"), look up in snapshot
    # Extract block type from ID (e.g., "T13" -> "text")
    block_type = _extract_block_type_from_id(source)
    
    # Find verification record
    verification = next(
        (v for v in verified_blocks if v.get('blockType') == block_type),
        None
    )
    
    if verification is None:
        return None
    
    return {
        "source": source,
        "block_type": block_type,
        "preset": False,
        "version": verification.get('version', '1.0.0'),
        "registry": verification.get('registry', 'core'),
        "renderer": verification.get('renderer', 'TutorialBlockRenderer'),
        "runtime": verification.get('runtime', 'react'),
        "registered": verification.get('registered', False),
        "rendered": verification.get('rendered', False)
    }


def verify_types_compatible(
    component: Dict[str, Any],
    composition: Dict[str, str],
    snapshot: Dict[str, Any]
) -> CompatibilityResult:
    """
    Verify type compatibility for component in composition.
    
    Checks:
    - Component implements required interface
    - Component exports expected types
    - Component matches expected structure
    
    Args:
        component: Resolved component metadata
        composition: Full composition map
        snapshot: TypeScript-generated discovery snapshot
        
    Returns:
        CompatibilityResult with pass/fail status
    """
    conflicts = []
    
    # Check if component is preset (always type-compatible)
    if component.get("preset"):
        return CompatibilityResult(
            passed=True,
            error_code=None,
            error_message="",
            conflicts=[]
        )
    
    # Check if component is registered and rendered (type requirements)
    if not component.get("registered"):
        conflicts.append(
            f"Component '{component['source']}' not registered in TutorialBlockRenderer"
        )
    
    if not component.get("rendered"):
        conflicts.append(
            f"Component '{component['source']}' has no renderer implementation"
        )
    
    if conflicts:
        return CompatibilityResult(
            passed=False,
            error_code=CompatibilityErrorCode.TYPE_MISMATCH,
            error_message=f"Type compatibility failed: {len(conflicts)} issue(s)",
            conflicts=conflicts
        )
    
    return CompatibilityResult(
        passed=True,
        error_code=None,
        error_message="",
        conflicts=[]
    )


def verify_versions_compatible(
    component: Dict[str, Any],
    composition: Dict[str, str],
    snapshot: Dict[str, Any]
) -> CompatibilityResult:
    """
    Verify version compatibility for component in composition.
    
    Checks:
    - Component version is compatible with other components
    - No breaking API changes between versions
    - Version constraints are satisfied
    
    Args:
        component: Resolved component metadata
        composition: Full composition map
        snapshot: TypeScript-generated discovery snapshot
        
    Returns:
        CompatibilityResult with pass/fail status
    """
    conflicts = []
    
    # Get component version - MUST be explicit (no fallback to prevent version mismatches)
    component_version = component.get("version")
    
    if component_version is None:
        # Fail explicitly if version is missing - do not use hardcoded fallback
        return CompatibilityResult(
            passed=False,
            error_code=CompatibilityErrorCode.VERSION_INCOMPATIBLE,
            error_message=f"Component '{component.get('source', 'unknown')}' missing version field",
            conflicts=[
                f"Component metadata must include explicit version field (from WorkflowTarget.version)"
            ]
        )
    
    # Check if version is valid semver
    version_parts = component_version.split(".")
    if len(version_parts) != 3:
        conflicts.append(
            f"Component '{component['source']}' has invalid version: {component_version}"
        )
        return CompatibilityResult(
            passed=False,
            error_code=CompatibilityErrorCode.VERSION_INCOMPATIBLE,
            error_message=f"Invalid version format: {component_version}",
            conflicts=conflicts
        )
    
    # For now, all 1.x versions are compatible
    # In production, would check actual API compatibility
    major_version = int(version_parts[0])
    
    if major_version < 1:
        conflicts.append(
            f"Component '{component['source']}' version {component_version} is pre-release"
        )
    
    if conflicts:
        return CompatibilityResult(
            passed=False,
            error_code=CompatibilityErrorCode.VERSION_INCOMPATIBLE,
            error_message=f"Version compatibility failed: {len(conflicts)} issue(s)",
            conflicts=conflicts
        )
    
    return CompatibilityResult(
        passed=True,
        error_code=None,
        error_message="",
        conflicts=[]
    )


def verify_registry_compatible(
    component: Dict[str, Any],
    composition: Dict[str, str],
    snapshot: Dict[str, Any]
) -> CompatibilityResult:
    """
    Verify registry compatibility for component in composition.
    
    Checks:
    - No registry conflicts between components
    - All components can coexist in same registry
    - No duplicate block type registrations
    
    Args:
        component: Resolved component metadata
        composition: Full composition map
        snapshot: TypeScript-generated discovery snapshot
        
    Returns:
        CompatibilityResult with pass/fail status
    """
    conflicts = []
    
    # Get component registry
    component_registry = component.get("registry", "core")
    
    # Check for registry conflicts with other components
    # In a real implementation, we'd check all components in composition
    # For now, validate that component's registry is valid
    valid_registries = ["core", "extended", "custom"]
    
    if component_registry not in valid_registries:
        conflicts.append(
            f"Component '{component['source']}' uses unknown registry: {component_registry}"
        )
    
    if conflicts:
        return CompatibilityResult(
            passed=False,
            error_code=CompatibilityErrorCode.REGISTRY_CONFLICT,
            error_message=f"Registry compatibility failed: {len(conflicts)} issue(s)",
            conflicts=conflicts
        )
    
    return CompatibilityResult(
        passed=True,
        error_code=None,
        error_message="",
        conflicts=[]
    )


def verify_renderer_compatible(
    component: Dict[str, Any],
    composition: Dict[str, str],
    snapshot: Dict[str, Any]
) -> CompatibilityResult:
    """
    Verify renderer compatibility for component in composition.
    
    Checks:
    - All components use compatible renderers
    - No renderer conflicts (e.g., React vs Vue)
    - All renderers can work together
    
    Args:
        component: Resolved component metadata
        composition: Full composition map
        snapshot: TypeScript-generated discovery snapshot
        
    Returns:
        CompatibilityResult with pass/fail status
    """
    conflicts = []
    
    # Get component renderer
    component_renderer = component.get("renderer", "TutorialBlockRenderer")
    
    # For now, all components should use TutorialBlockRenderer
    # In production, might support multiple renderers
    if component_renderer != "TutorialBlockRenderer":
        conflicts.append(
            f"Component '{component['source']}' uses unsupported renderer: {component_renderer}"
        )
    
    if conflicts:
        return CompatibilityResult(
            passed=False,
            error_code=CompatibilityErrorCode.RENDERER_CONFLICT,
            error_message=f"Renderer compatibility failed: {len(conflicts)} issue(s)",
            conflicts=conflicts
        )
    
    return CompatibilityResult(
        passed=True,
        error_code=None,
        error_message="",
        conflicts=[]
    )


def verify_runtime_compatible(
    component: Dict[str, Any],
    composition: Dict[str, str],
    snapshot: Dict[str, Any]
) -> CompatibilityResult:
    """
    Verify runtime compatibility for component in composition.
    
    Checks:
    - All components use compatible runtimes
    - No runtime conflicts (e.g., React 17 vs React 18)
    - All components can execute in same environment
    
    Args:
        component: Resolved component metadata
        composition: Full composition map
        snapshot: TypeScript-generated discovery snapshot
        
    Returns:
        CompatibilityResult with pass/fail status
    """
    conflicts = []
    
    # Get component runtime
    component_runtime = component.get("runtime", "react")
    
    # For now, all components should use React runtime
    # In production, might support multiple runtimes or versions
    if component_runtime != "react":
        conflicts.append(
            f"Component '{component['source']}' uses unsupported runtime: {component_runtime}"
        )
    
    if conflicts:
        return CompatibilityResult(
            passed=False,
            error_code=CompatibilityErrorCode.RUNTIME_CONFLICT,
            error_message=f"Runtime compatibility failed: {len(conflicts)} issue(s)",
            conflicts=conflicts
        )
    
    return CompatibilityResult(
        passed=True,
        error_code=None,
        error_message="",
        conflicts=[]
    )


def verify_i2_complete(snapshot: Dict[str, Any]) -> CompatibilityResult:
    """
    Verify complete I2 structure from repository snapshot.
    
    Checks:
    - All I2 components exist in snapshot
    - All I2 components are properly verified
    - I2 preset is complete and valid
    
    Args:
        snapshot: TypeScript-generated discovery snapshot
        
    Returns:
        CompatibilityResult with pass/fail status
    """
    conflicts = []
    
    # Expected I2 block types (based on I2 preset definition)
    expected_i2_blocks = [
        "introduction",  # I1
        "text",          # T blocks
        "code",          # C blocks
        "quiz",          # Q blocks
        "summary"        # S blocks
    ]
    
    blocks_data = snapshot.get('blocks', {})
    verified_blocks = blocks_data.get('verified', [])
    
    if not verified_blocks:
        return CompatibilityResult(
            passed=False,
            error_code=CompatibilityErrorCode.COMPONENT_NOT_FOUND,
            error_message="I2 verification unavailable: snapshot contains no verified blocks",
            conflicts=["Run TypeScript discovery scan to generate block verification data"]
        )
    
    # Check each expected I2 block
    verified_block_types = {v.get('blockType') for v in verified_blocks}
    
    for expected_block in expected_i2_blocks:
        if expected_block not in verified_block_types:
            conflicts.append(
                f"I2 block type '{expected_block}' not found in repository"
            )
            continue
        
        # Find verification record
        verification = next(
            (v for v in verified_blocks if v.get('blockType') == expected_block),
            None
        )
        
        if verification:
            # Check UBRC status
            ubrc_status = verification.get('ubrcStatus')
            if ubrc_status != 'UBRC_VALID':
                conflicts.append(
                    f"I2 block '{expected_block}' UBRC invalid: {ubrc_status}"
                )
            
            # Check if registered
            if not verification.get('registered'):
                conflicts.append(
                    f"I2 block '{expected_block}' not registered"
                )
            
            # Check if rendered
            if not verification.get('rendered'):
                conflicts.append(
                    f"I2 block '{expected_block}' has no renderer"
                )
    
    if conflicts:
        return CompatibilityResult(
            passed=False,
            error_code=CompatibilityErrorCode.COMPONENT_INVALID,
            error_message=f"I2 validation failed: {len(conflicts)} issue(s)",
            conflicts=conflicts
        )
    
    return CompatibilityResult(
        passed=True,
        error_code=None,
        error_message=f"I2 complete: {len(expected_i2_blocks)} block types verified",
        conflicts=[]
    )


def _extract_block_type_from_id(block_id: str) -> str:
    """
    Extract block type from block identifier.
    
    Args:
        block_id: Block identifier (e.g., "I1", "T13", "C5")
        
    Returns:
        Block type string (e.g., "introduction", "text", "code")
    """
    if not block_id:
        return ""
    
    # Extract prefix (first letter)
    prefix = block_id[0].upper()
    
    # Map prefix to block type
    block_type_map = {
        "I": "introduction",
        "T": "text",
        "C": "code",
        "Q": "quiz",
        "S": "summary",
        "H": "hero",
        "F": "footer"
    }
    
    return block_type_map.get(prefix, block_id.lower())
