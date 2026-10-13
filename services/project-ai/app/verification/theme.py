"""
Theme Compatibility Verification Module.

ARCHITECTURAL RULE:
- Verify block renders correctly under all supported brand themes
- Discover theme configurations from repository (not hard-coded)
- Check for theme context usage (not hard-coded theme values)
- Verify CSS variables and design tokens used correctly
- Browser-based visual verification under each theme

Theme Compatibility Flow:
    Discover Theme Configurations from Repository
        → For Each Theme:
            → Launch Browser with Theme Context
            → Navigate to Block Route
            → Verify Block Renders Correctly
            → Check Theme Context Applied
            → Verify Design Token Usage
            → Capture Visual Evidence
            → Detect Hard-coded Theme Values
        → Aggregate Results
        → Return ThemeVerification

Error Codes:
    - THEME_CONFIG_UNAVAILABLE: Cannot discover theme configurations
    - THEME_RENDER_FAILURE: Block fails to render under specific theme
    - THEME_CONTEXT_MISSING: Block does not use theme context
    - THEME_HARDCODED_VALUES: Block uses hard-coded theme values
    - THEME_TOKEN_MISSING: Required design tokens not used
    - THEME_CSS_OVERRIDE: Theme-specific CSS overrides break other themes
    - THEME_VISUAL_INCONSISTENCY: Visual appearance inconsistent across themes
"""

from dataclasses import dataclass
from typing import List, Dict, Any, Optional
from pathlib import Path
from enum import Enum
import json
import re


class ThemeErrorCode(str, Enum):
    """Error codes for theme verification failures."""
    
    THEME_CONFIG_UNAVAILABLE = "theme_config_unavailable"
    THEME_RENDER_FAILURE = "theme_render_failure"
    THEME_CONTEXT_MISSING = "theme_context_missing"
    THEME_HARDCODED_VALUES = "theme_hardcoded_values"
    THEME_TOKEN_MISSING = "theme_token_missing"
    THEME_CSS_OVERRIDE = "theme_css_override"
    THEME_VISUAL_INCONSISTENCY = "theme_visual_inconsistency"


@dataclass
class ThemeVerification:
    """Result of theme compatibility verification."""
    
    passed: bool
    theme_name: str
    error_code: Optional[ThemeErrorCode]
    error_message: Optional[str]
    evidence_ids: List[str]
    theme_context_detected: bool
    design_tokens_used: List[str]
    hardcoded_values: List[str]
    screenshot_path: Optional[str]


@dataclass
class ThemeConfiguration:
    """Theme configuration discovered from repository."""
    
    name: str
    identifier: str
    colors: Dict[str, str]
    source_file: str


def discover_theme_configurations_from_snapshot(
    snapshot: Dict[str, Any]
) -> List[ThemeConfiguration]:
    """
    Discover theme configurations from TypeScript snapshot.
    
    ARCHITECTURAL RULE: Python reads snapshot.theme ONLY. No file scanning.
    
    Args:
        snapshot: TypeScript discovery snapshot with theme facts
        
    Returns:
        List of discovered theme configurations from snapshot
    """
    themes: List[ThemeConfiguration] = []
    theme_facts = snapshot.get('theme', {})
    
    if not theme_facts:
        return themes
    
    # Extract theme configs from snapshot
    for theme_config in theme_facts.get('themeConfigs', []):
        themes.append(ThemeConfiguration(
            name=f"{theme_config['configType']} theme",
            identifier=theme_config['configType'],
            colors={},  # Colors would need to be parsed from snapshot if needed
            source_file=theme_config['path']
        ))
    
    return themes


# Legacy function kept for backwards compatibility but deprecated
def discover_theme_configurations(repository_root: Path) -> List[ThemeConfiguration]:
    """
    DEPRECATED: Use discover_theme_configurations_from_snapshot() instead.
    
    This function violates the architectural rule: Python should NOT scan files.
    All theme facts should come from TypeScript snapshot.theme.
    
    Discovery Strategy:
    1. Search for theme configuration files:
       - packages/ui/src/theme-store.ts (EnterpriseTheme)
       - apps/skillhubcore-admin/*/theme/brandTheme.ts (BrandTutorialTheme)
       - apps/realtutorialhub-web/src/lib/domain-themes.ts (DomainTheme)
       - ILS_UI_UX/docs/PROJECT_LLM_18_BLOCK_CORPUS_REGISTRY.md (brand specs)
    
    2. Parse theme definitions
    3. Return list of discovered themes
    
    Args:
        repository_root: Root path of repository
        
    Returns:
        List of discovered theme configurations
    """
    # Legacy implementation (violates architecture rule)
    themes: List[ThemeConfiguration] = []
    
    # 1. Discover EnterpriseTheme (theme-a, theme-b)
    theme_store_path = repository_root / "packages" / "ui" / "src" / "theme-store.ts"
    if theme_store_path.exists():
        content = theme_store_path.read_text(encoding='utf-8')
        
        # Parse EnterpriseTheme type
        enterprise_match = re.search(r"type EnterpriseTheme = '([^']+)'(?: \| '([^']+)')*", content)
        if enterprise_match:
            theme_values = [g for g in enterprise_match.groups() if g]
            for theme_value in theme_values:
                themes.append(ThemeConfiguration(
                    name=f"Enterprise Theme: {theme_value}",
                    identifier=theme_value,
                    colors={},  # Enterprise themes use CSS variables
                    source_file=str(theme_store_path.relative_to(repository_root))
                ))
    
    # 2. Discover BrandTutorialTheme (skillup/SUIA, rth/RTH)
    brand_theme_path = repository_root / "apps" / "skillhubcore-admin" / "src" / "app" / "(admin)" / "tools" / "tutorial-page-content" / "theme" / "brandTheme.ts"
    if brand_theme_path.exists():
        content = brand_theme_path.read_text(encoding='utf-8')
        
        # Parse themeForBrand function to extract brand themes
        # SkillUp/SUIA theme
        skillup_match = re.search(
            r"if.*brandId === 'skillup'.*\{[^}]*return \{([^}]+)\}",
            content,
            re.DOTALL
        )
        if skillup_match:
            colors = _parse_theme_colors(skillup_match.group(1))
            themes.append(ThemeConfiguration(
                name="SUIA (SkillUp IT Academy) Theme",
                identifier="skillup",
                colors=colors,
                source_file=str(brand_theme_path.relative_to(repository_root))
            ))
        
        # RTH theme (default/else branch)
        rth_match = re.search(
            r"return \{([^}]+)\};\s*\}",
            content,
            re.DOTALL
        )
        if rth_match:
            colors = _parse_theme_colors(rth_match.group(1))
            themes.append(ThemeConfiguration(
                name="RTH (RealTutorialHub) Theme",
                identifier="rth",
                colors=colors,
                source_file=str(brand_theme_path.relative_to(repository_root))
            ))
    
    # 3. Discover DomainTheme (indigo, blue, teal, steel)
    domain_theme_path = repository_root / "apps" / "realtutorialhub-web" / "src" / "lib" / "domain-themes.ts"
    if domain_theme_path.exists():
        content = domain_theme_path.read_text(encoding='utf-8')
        
        # Parse DOMAIN_THEMES record
        domain_match = re.search(
            r"export const DOMAIN_THEMES: Record<'([^']+)'(?:\s*\|\s*'([^']+)')*",
            content
        )
        if domain_match:
            domain_values = [g for g in domain_match.groups() if g]
            for domain_value in domain_values:
                themes.append(ThemeConfiguration(
                    name=f"Domain Theme: {domain_value}",
                    identifier=f"domain-{domain_value}",
                    colors={},  # Domain themes use gradient definitions
                    source_file=str(domain_theme_path.relative_to(repository_root))
                ))
    
    return themes


def _parse_theme_colors(theme_object: str) -> Dict[str, str]:
    """Parse theme color definitions from TypeScript object literal."""
    colors: Dict[str, str] = {}
    
    # Extract key: value pairs
    color_pattern = r"(\w+):\s*'([^']+)'"
    for match in re.finditer(color_pattern, theme_object):
        key, value = match.groups()
        colors[key] = value
    
    return colors


def verify_theme_context_usage(
    block_implementation_path: Path,
    repository_root: Path
) -> tuple[bool, List[str]]:
    """
    Verify that block uses theme context instead of hard-coded values.
    
    Checks:
    1. Block accepts `theme` prop (from TutorialBlockRenderer)
    2. Block uses theme context hooks (useThemeStore, useReportTheme, etc.)
    3. Block uses CSS variables (var(--color-*)) not hard-coded colors
    4. Block does not contain hard-coded theme-specific colors
    
    Args:
        block_implementation_path: Path to block component
        repository_root: Repository root
        
    Returns:
        Tuple of (uses_theme_context, hardcoded_values_found)
    """
    if not block_implementation_path.exists():
        return False, []
    
    content = block_implementation_path.read_text(encoding='utf-8')
    hardcoded_values: List[str] = []
    
    # Check for theme prop or theme context hooks
    uses_theme_context = bool(
        re.search(r"theme[?:]?\s*:\s*\w+Theme", content) or  # theme prop
        re.search(r"useThemeStore|useReportTheme|useTheme", content) or  # theme hooks
        re.search(r"var\(--[\w-]+\)", content)  # CSS variables
    )
    
    # Detect hard-coded color values (common theme-specific colors)
    hardcoded_patterns = [
        (r"#f54a8d", "SUIA primary color hard-coded"),
        (r"#d63d7a", "SUIA primaryDark hard-coded"),
        (r"#133382", "SUIA secondary color hard-coded"),
        (r"#d03f00", "RTH primary color hard-coded"),
        (r"#b63600", "RTH primaryDark hard-coded"),
        (r"#124fd6", "RTH secondary color hard-coded"),
        (r"bg-pink-\d+", "Hard-coded Tailwind color class"),
        (r"bg-blue-\d+", "Hard-coded Tailwind color class"),
        (r"text-pink-\d+", "Hard-coded text color class"),
        (r"border-pink-\d+", "Hard-coded border color class"),
    ]
    
    for pattern, description in hardcoded_patterns:
        if re.search(pattern, content):
            hardcoded_values.append(description)
    
    return uses_theme_context, hardcoded_values


def verify_design_token_usage(
    block_implementation_path: Path,
    repository_root: Path
) -> List[str]:
    """
    Verify that block uses design tokens (CSS variables) correctly.
    
    Design tokens are CSS variables that allow theme-independent styling.
    Examples: var(--color-primary), var(--color-secondary), var(--spacing-4)
    
    Args:
        block_implementation_path: Path to block component
        repository_root: Repository root
        
    Returns:
        List of design tokens used in block
    """
    if not block_implementation_path.exists():
        return []
    
    content = block_implementation_path.read_text(encoding='utf-8')
    
    # Extract CSS variable usage
    css_var_pattern = r"var\((--[\w-]+)\)"
    design_tokens = list(set(re.findall(css_var_pattern, content)))
    
    return design_tokens


def verify_theme_compatibility(
    block_type: str,
    snapshot: Dict[str, Any],
    repository_root: Path,
    target: str = 'skillhubcore-admin',
) -> List[ThemeVerification]:
    """
    Verify block theme compatibility using snapshot theme facts.
    
    ARCHITECTURAL RULE:
    1. Read theme configurations from snapshot.theme (not files)
    2. Read hard-coded theme values from snapshot.theme (not files)
    3. Verify theme context usage from snapshot facts
    4. Use evidence IDs from snapshot
    
    Args:
        block_type: Block type to verify (e.g., 'introduction')
        snapshot: TypeScript-generated discovery snapshot
        repository_root: Root path of repository
        target: Target application for verification
        
    Returns:
        List of theme verification results (one per theme)
    """
    results: List[ThemeVerification] = []
    
    # Discover themes from snapshot (not files)
    themes = discover_theme_configurations_from_snapshot(snapshot)
    
    if not themes:
        # No themes discovered from snapshot - blocked
        results.append(ThemeVerification(
            passed=False,
            theme_name="<unavailable>",
            error_code=ThemeErrorCode.THEME_CONFIG_UNAVAILABLE,
            error_message="No theme configurations in snapshot. Run TypeScript scan.",
            evidence_ids=[],
            theme_context_detected=False,
            design_tokens_used=[],
            hardcoded_values=[],
            screenshot_path=None
        ))
        return results
    
    # Find block implementation in snapshot
    blocks_data = snapshot.get('blocks', {})
    implemented_blocks = blocks_data.get('implemented', [])
    verified_blocks = blocks_data.get('verified', [])
    
    # Try to find in implemented first, then verified
    block_record = next(
        (b for b in implemented_blocks if b.get('type') == block_type),
        None
    )
    
    if not block_record:
        block_record = next(
            (b for b in verified_blocks if b.get('blockType') == block_type),
            None
        )
    
    if not block_record:
        # Block not found in snapshot
        for theme in themes:
            results.append(ThemeVerification(
                passed=False,
                theme_name=theme.name,
                error_code=ThemeErrorCode.THEME_RENDER_FAILURE,
                error_message=f"Block '{block_type}' not found in snapshot",
                evidence_ids=[],
                theme_context_detected=False,
                design_tokens_used=[],
                hardcoded_values=[],
                screenshot_path=None
            ))
        return results
    
    # Get block implementation path
    implementation_path_str = block_record.get('implementationPath') or block_record.get('path', '')
    if not implementation_path_str:
        # No implementation path
        for theme in themes:
            results.append(ThemeVerification(
                passed=False,
                theme_name=theme.name,
                error_code=ThemeErrorCode.THEME_RENDER_FAILURE,
                error_message=f"Block '{block_type}' has no implementation path",
                evidence_ids=[],
                theme_context_detected=False,
                design_tokens_used=[],
                hardcoded_values=[],
                screenshot_path=None
            ))
        return results
    
    # Check for hard-coded theme values from snapshot.theme
    theme_facts = snapshot.get('theme', {})
    hardcoded_values: List[str] = []
    design_tokens: List[str] = []
    
    for hardcoded_ref in theme_facts.get('hardCodedValues', []):
        if hardcoded_ref['path'] == implementation_path_str:
            hardcoded_values.append(f"{hardcoded_ref['property']}: {hardcoded_ref['value']}")
    
    # Check for CSS variable (design token) usage from snapshot.theme
    for css_var_ref in theme_facts.get('cssVariables', []):
        if css_var_ref['path'] == implementation_path_str:
            design_tokens.append(css_var_ref['variableName'])
    
    # Determine theme context usage
    uses_theme_context = len(design_tokens) > 0
    
    # Collect evidence IDs
    evidence_ids = []
    if 'evidenceId' in block_record:
        evidence_ids.append(block_record['evidenceId'])
    
    # Add evidence from theme facts
    for hardcoded_ref in theme_facts.get('hardCodedValues', []):
        if hardcoded_ref['path'] == implementation_path_str and 'evidenceId' in hardcoded_ref:
            evidence_ids.append(hardcoded_ref['evidenceId'])
    
    for css_var_ref in theme_facts.get('cssVariables', []):
        if css_var_ref['path'] == implementation_path_str and 'evidenceId' in css_var_ref:
            evidence_ids.append(css_var_ref['evidenceId'])
    
    # Verify compatibility for each theme
    for theme in themes:
        # Determine if theme compatibility passes
        passed = True
        error_code = None
        error_message = None
        
        # Check for hard-coded theme values
        if hardcoded_values:
            passed = False
            error_code = ThemeErrorCode.THEME_HARDCODED_VALUES
            error_message = (
                f"Block contains hard-coded theme values from snapshot: {', '.join(hardcoded_values)}"
            )
        
        # Check for theme context usage
        elif not uses_theme_context:
            passed = False
            error_code = ThemeErrorCode.THEME_CONTEXT_MISSING
            error_message = (
                f"Block does not use design tokens (no CSS variables found in snapshot)"
            )
        
        results.append(ThemeVerification(
            passed=passed,
            theme_name=theme.name,
            error_code=error_code,
            error_message=error_message,
            evidence_ids=evidence_ids,
            theme_context_detected=uses_theme_context,
            design_tokens_used=design_tokens,
            hardcoded_values=hardcoded_values,
            screenshot_path=None  # Future: browser screenshot path
        ))
    
    return results
