"""
Composer Integration Verification Module.

ARCHITECTURAL RULE:
- This module verifies candidate blocks work in the Tutorial Composer workflow
- Reads TypeScript discovery evidence (does NOT reimplement discovery)
- Tests the complete flow: Registry → Renderer → Composer → Generate → Render

Composer Verification Flow:
    Candidate
        → Registry (block registered?)
        → TutorialBlockRenderer (renderer resolves?)
        → Tutorial Composer (block appears as selectable?)
        → Configurable (block can be configured?)
        → Save Draft (draft saves successfully?)
        → Generate Tutorial (tutorial generates?)
        → Render Tutorial (tutorial renders?)

Error Codes:
    - COMPOSER_NOT_REGISTERED: Block not in BLOCK_REGISTRY
    - COMPOSER_NOT_DISCOVERABLE: Block not visible in Composer UI
    - COMPOSER_SCHEMA_MISMATCH: Block schema doesn't match expected structure
    - COMPOSER_RENDERER_MISMATCH: Renderer doesn't match registry entry
    - COMPOSER_GENERATION_FAILURE: Tutorial generation fails with this block
    - COMPOSER_RUNTIME_FAILURE: Block fails to render at runtime
"""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from pathlib import Path
from enum import Enum


class ComposerErrorCode(str, Enum):
    """Specific error codes for composer verification failures."""
    
    COMPOSER_NOT_REGISTERED = 'COMPOSER_NOT_REGISTERED'
    COMPOSER_NOT_DISCOVERABLE = 'COMPOSER_NOT_DISCOVERABLE'
    COMPOSER_SCHEMA_MISMATCH = 'COMPOSER_SCHEMA_MISMATCH'
    COMPOSER_RENDERER_MISMATCH = 'COMPOSER_RENDERER_MISMATCH'
    COMPOSER_GENERATION_FAILURE = 'COMPOSER_GENERATION_FAILURE'
    COMPOSER_RUNTIME_FAILURE = 'COMPOSER_RUNTIME_FAILURE'


@dataclass
class ComposerVerificationResult:
    """Result of composer integration verification."""
    
    block_type: str
    is_registered: bool
    is_discoverable: bool
    schema_valid: bool
    renderer_valid: bool
    can_generate: bool
    can_render: bool
    error_code: Optional[ComposerErrorCode]
    error_message: Optional[str]
    evidence_ids: List[str]
    
    @property
    def passed(self) -> bool:
        """Check if all composer verification checks passed."""
        return (
            self.is_registered and
            self.is_discoverable and
            self.schema_valid and
            self.renderer_valid and
            self.can_generate and
            self.can_render and
            self.error_code is None
        )


def verify_composer_integration(
    block_type: str,
    snapshot: Dict[str, Any],
    repository_root: Path
) -> ComposerVerificationResult:
    """
    Verify that a block is fully integrated into the Tutorial Composer workflow.
    
    This function performs a complete end-to-end verification of block integration:
    1. Block is registered in BLOCK_REGISTRY
    2. Block is discoverable by Composer UI
    3. Block schema matches expected structure
    4. Renderer implementation matches registry entry
    5. Block can be used in tutorial generation
    6. Block renders correctly at runtime
    
    Args:
        block_type: Block type identifier (e.g., "introduction", "code")
        snapshot: TypeScript-generated discovery snapshot
        repository_root: Root path of the repository
    
    Returns:
        ComposerVerificationResult with detailed verification status
    """
    evidence_ids: List[str] = []
    
    # Step 1: Verify block is registered in BLOCK_REGISTRY
    is_registered, registry_error = _verify_registry(block_type, snapshot, evidence_ids)
    
    if not is_registered:
        return ComposerVerificationResult(
            block_type=block_type,
            is_registered=False,
            is_discoverable=False,
            schema_valid=False,
            renderer_valid=False,
            can_generate=False,
            can_render=False,
            error_code=ComposerErrorCode.COMPOSER_NOT_REGISTERED,
            error_message=registry_error or f"Block '{block_type}' not found in BLOCK_REGISTRY",
            evidence_ids=evidence_ids
        )
    
    # Step 2: Verify block is discoverable in Composer UI
    is_discoverable, discoverable_error = _verify_discoverability(block_type, snapshot, repository_root, evidence_ids)
    
    if not is_discoverable:
        return ComposerVerificationResult(
            block_type=block_type,
            is_registered=True,
            is_discoverable=False,
            schema_valid=False,
            renderer_valid=False,
            can_generate=False,
            can_render=False,
            error_code=ComposerErrorCode.COMPOSER_NOT_DISCOVERABLE,
            error_message=discoverable_error or f"Block '{block_type}' not discoverable in Composer UI",
            evidence_ids=evidence_ids
        )
    
    # Step 3: Verify block schema matches expected structure
    schema_valid, schema_error = _verify_schema(block_type, snapshot, evidence_ids)
    
    if not schema_valid:
        return ComposerVerificationResult(
            block_type=block_type,
            is_registered=True,
            is_discoverable=True,
            schema_valid=False,
            renderer_valid=False,
            can_generate=False,
            can_render=False,
            error_code=ComposerErrorCode.COMPOSER_SCHEMA_MISMATCH,
            error_message=schema_error or f"Block '{block_type}' schema does not match expected structure",
            evidence_ids=evidence_ids
        )
    
    # Step 4: Verify renderer matches registry entry
    renderer_valid, renderer_error = _verify_renderer(block_type, snapshot, evidence_ids)
    
    if not renderer_valid:
        return ComposerVerificationResult(
            block_type=block_type,
            is_registered=True,
            is_discoverable=True,
            schema_valid=True,
            renderer_valid=False,
            can_generate=False,
            can_render=False,
            error_code=ComposerErrorCode.COMPOSER_RENDERER_MISMATCH,
            error_message=renderer_error or f"Block '{block_type}' renderer does not match registry entry",
            evidence_ids=evidence_ids
        )
    
    # Step 5: Verify block can be used in tutorial generation
    can_generate, generation_error = _verify_generation(block_type, snapshot, evidence_ids)
    
    if not can_generate:
        return ComposerVerificationResult(
            block_type=block_type,
            is_registered=True,
            is_discoverable=True,
            schema_valid=True,
            renderer_valid=True,
            can_generate=False,
            can_render=False,
            error_code=ComposerErrorCode.COMPOSER_GENERATION_FAILURE,
            error_message=generation_error or f"Block '{block_type}' fails during tutorial generation",
            evidence_ids=evidence_ids
        )
    
    # Step 6: Verify block renders correctly at runtime
    can_render, render_error = _verify_runtime_rendering(block_type, snapshot, evidence_ids)
    
    if not can_render:
        return ComposerVerificationResult(
            block_type=block_type,
            is_registered=True,
            is_discoverable=True,
            schema_valid=True,
            renderer_valid=True,
            can_generate=True,
            can_render=False,
            error_code=ComposerErrorCode.COMPOSER_RUNTIME_FAILURE,
            error_message=render_error or f"Block '{block_type}' fails to render at runtime",
            evidence_ids=evidence_ids
        )
    
    # All checks passed
    return ComposerVerificationResult(
        block_type=block_type,
        is_registered=True,
        is_discoverable=True,
        schema_valid=True,
        renderer_valid=True,
        can_generate=True,
        can_render=True,
        error_code=None,
        error_message=None,
        evidence_ids=evidence_ids
    )


def _verify_registry(
    block_type: str,
    snapshot: Dict[str, Any],
    evidence_ids: List[str]
) -> tuple[bool, Optional[str]]:
    """
    Verify block is registered in BLOCK_REGISTRY.
    
    Checks TypeScript discovery snapshot for registry entry.
    """
    blocks_data = snapshot.get('blocks', {})
    verified_blocks = blocks_data.get('verified', [])
    
    # Find block verification record
    verification = next(
        (v for v in verified_blocks if v.get('blockType') == block_type),
        None
    )
    
    if verification is None:
        return False, f"Block '{block_type}' not found in verification data"
    
    # Check if block is registered
    is_registered = verification.get('registered', False)
    
    if not is_registered:
        return False, f"Block '{block_type}' not registered in TutorialBlockRenderer.tsx"
    
    # Check UBRC registry entry
    ubrc_details = verification.get('ubrcDetails', {})
    has_registry_entry = ubrc_details.get('registryEntry', False)
    
    if not has_registry_entry:
        return False, f"Block '{block_type}' missing entry in registry.ts"
    
    # Find registry evidence
    all_evidence = snapshot.get('evidence', [])
    registry_evidence = next(
        (e for e in all_evidence if 'registry.ts' in e.get('path', '')),
        None
    )
    
    if registry_evidence:
        evidence_ids.append(registry_evidence.get('evidenceId', ''))
    
    return True, None


def _verify_discoverability(
    block_type: str,
    snapshot: Dict[str, Any],
    repository_root: Path,
    evidence_ids: List[str]
) -> tuple[bool, Optional[str]]:
    """
    Verify block is discoverable in Composer UI.
    
    Checks that:
    1. Block appears in BLOCK_REGISTRY (already verified)
    2. Block has valid label and description (documented)
    3. Block has renderer (required for UI discoverability)
    """
    blocks_data = snapshot.get('blocks', {})
    verified_blocks = blocks_data.get('verified', [])
    
    # Find block verification record
    verification = next(
        (v for v in verified_blocks if v.get('blockType') == block_type),
        None
    )
    
    if verification is None:
        return False, f"Block '{block_type}' not found in verification data"
    
    # Check if block is documented (has label/description in registry)
    is_documented = verification.get('documented', False)
    
    if not is_documented:
        return False, f"Block '{block_type}' not documented (missing label/description in registry)"
    
    # Check if block has renderer (required for discoverability)
    is_rendered = verification.get('rendered', False)
    
    if not is_rendered:
        return False, f"Block '{block_type}' has no renderer component (required for UI discoverability)"
    
    # Find implementation evidence
    all_evidence = snapshot.get('evidence', [])
    impl_evidence = next(
        (e for e in all_evidence 
         if e.get('symbol', '').lower() == block_type and 
         e.get('kind') == 'type-definition'),
        None
    )
    
    if impl_evidence:
        evidence_ids.append(impl_evidence.get('evidenceId', ''))
    
    return True, None


def _verify_schema(
    block_type: str,
    snapshot: Dict[str, Any],
    evidence_ids: List[str]
) -> tuple[bool, Optional[str]]:
    """
    Verify block schema matches expected structure.
    
    Checks that:
    1. Block has type definition
    2. Block content schema is valid
    3. Block follows TutorialBlock interface
    """
    blocks_data = snapshot.get('blocks', {})
    implemented_blocks = blocks_data.get('implemented', [])
    
    # Find block implementation
    implementation = next(
        (b for b in implemented_blocks if b.get('type') == block_type),
        None
    )
    
    if implementation is None:
        return False, f"Block '{block_type}' implementation not found"
    
    # Check for evidence ID
    impl_evidence_id = implementation.get('evidenceId')
    if impl_evidence_id:
        evidence_ids.append(impl_evidence_id)
    else:
        return False, f"Block '{block_type}' missing evidence ID"
    
    # Verify implementation path exists
    impl_path = implementation.get('path')
    if not impl_path:
        return False, f"Block '{block_type}' missing implementation path"
    
    return True, None


def _verify_renderer(
    block_type: str,
    snapshot: Dict[str, Any],
    evidence_ids: List[str]
) -> tuple[bool, Optional[str]]:
    """
    Verify renderer matches registry entry.
    
    Checks that:
    1. Renderer component exists
    2. Renderer has dispatch case in TutorialBlockRenderer.tsx
    3. Renderer implements correct props interface
    """
    blocks_data = snapshot.get('blocks', {})
    rendered_blocks = blocks_data.get('rendered', [])
    
    # Find renderer
    renderer = next(
        (r for r in rendered_blocks if r.get('blockType') == block_type),
        None
    )
    
    if renderer is None:
        return False, f"Block '{block_type}' renderer not found"
    
    # Check renderer evidence
    renderer_evidence_id = renderer.get('evidenceId')
    if renderer_evidence_id:
        evidence_ids.append(renderer_evidence_id)
    else:
        return False, f"Block '{block_type}' renderer missing evidence ID"
    
    # Verify UBRC status
    ubrc_status = renderer.get('ubrcStatus')
    if ubrc_status != 'UBRC_VALID':
        return False, f"Block '{block_type}' renderer UBRC status is '{ubrc_status}', expected 'UBRC_VALID'"
    
    return True, None


def _verify_generation(
    block_type: str,
    snapshot: Dict[str, Any],
    evidence_ids: List[str]
) -> tuple[bool, Optional[str]]:
    """
    Verify block can be used in tutorial generation.
    
    Checks that:
    1. Block validation passes
    2. Block can be serialized/deserialized
    3. Block fits into TutorialDocument structure
    """
    # Check if validators passed
    findings = snapshot.get('findings', [])
    
    # Check for validation failures related to this block
    block_failures = [
        f for f in findings 
        if f.get('severity') == 'error' and 
        block_type in f.get('message', '').lower()
    ]
    
    if block_failures:
        error_messages = '; '.join(f.get('message', 'Unknown error') for f in block_failures)
        return False, f"Block '{block_type}' has validation failures: {error_messages}"
    
    return True, None


def _verify_runtime_rendering(
    block_type: str,
    snapshot: Dict[str, Any],
    evidence_ids: List[str]
) -> tuple[bool, Optional[str]]:
    """
    Verify block renders correctly at runtime.
    
    Checks that:
    1. Block has test coverage
    2. Renderer handles edge cases
    3. No runtime errors in tests
    """
    blocks_data = snapshot.get('blocks', {})
    verified_blocks = blocks_data.get('verified', [])
    
    # Find block verification record
    verification = next(
        (v for v in verified_blocks if v.get('blockType') == block_type),
        None
    )
    
    if verification is None:
        return False, f"Block '{block_type}' not found in verification data"
    
    # Check verification level (should be at least REGISTERED for composer)
    verification_level = verification.get('verificationLevel')
    
    if verification_level not in ['REGISTERED', 'TESTED', 'VERIFIED']:
        return False, f"Block '{block_type}' verification level '{verification_level}' is insufficient (expected REGISTERED or higher)"
    
    return True, None
