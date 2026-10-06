"""
Brand Independence Verification Module.

ARCHITECTURAL RULE:
- This module verifies candidate blocks are brand-independent
- Scans for hard-coded brand coupling (colors, logos, URLs, fonts, brand IDs)
- Allows CSS variables, design tokens, and theme-based styling
- Provides specific findings with file paths, line numbers, and recommendations

Brand Independence Principles:
    ✅ ALLOWED:
        - CSS variables: var(--color-primary), var(--font-heading)
        - Design tokens: theme.colors.primary, theme.spacing.md
        - Tailwind classes: bg-primary-500, text-secondary-700
        - Props/data-driven: color={theme.primary}, src={logoUrl}
        - Conditional brand logic: brandConfig[brand].logo
    
    ❌ BRAND COUPLING:
        - Hard-coded colors: #FF5A00, rgb(255, 90, 0), hsl(20, 100%, 50%)
        - Hard-coded logos: /images/skillhub-logo.png, import logo from './logo.svg'
        - Hard-coded URLs: https://skillhub.com, www.realtutorialhub.com
        - Hard-coded fonts: font-family: 'Poppins', font-family: 'Inter'
        - Brand IDs in code: brandId: 'skillhub', brand === 'realtutorialhub'
        - Trademarked text: "SkillHub", "Real Tutorial Hub" (in code, not UI content)

Error Codes:
    - BRAND_HARDCODED_COLOR: Hard-coded color value found
    - BRAND_HARDCODED_LOGO: Hard-coded logo path or import found
    - BRAND_HARDCODED_URL: Hard-coded brand-specific URL found
    - BRAND_HARDCODED_FONT: Hard-coded font-family value found
    - BRAND_HARDCODED_ID: Hard-coded brand ID in code found
    - BRAND_HARDCODED_ASSET: Hard-coded brand-specific asset path found
    - BRAND_TRADEMARK_TEXT: Trademarked brand text in code found
"""

import re
from dataclasses import dataclass, field
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from enum import Enum


class BrandErrorCode(str, Enum):
    """Specific error codes for brand independence verification failures."""
    
    BRAND_HARDCODED_COLOR = 'BRAND_HARDCODED_COLOR'
    BRAND_HARDCODED_LOGO = 'BRAND_HARDCODED_LOGO'
    BRAND_HARDCODED_URL = 'BRAND_HARDCODED_URL'
    BRAND_HARDCODED_FONT = 'BRAND_HARDCODED_FONT'
    BRAND_HARDCODED_ID = 'BRAND_HARDCODED_ID'
    BRAND_HARDCODED_ASSET = 'BRAND_HARDCODED_ASSET'
    BRAND_TRADEMARK_TEXT = 'BRAND_TRADEMARK_TEXT'


@dataclass
class BrandFinding:
    """A single brand coupling finding."""
    
    file_path: str
    line_number: int
    error_code: BrandErrorCode
    description: str
    actual_value: str
    recommendation: str
    context: str = ""  # Surrounding code context


@dataclass
class BrandVerificationResult:
    """Result of brand independence verification."""
    
    file_path: str
    passed: bool
    findings: List[BrandFinding] = field(default_factory=list)
    is_theme_aware: bool = False
    theme_patterns_found: List[str] = field(default_factory=list)
    evidence_ids: List[str] = field(default_factory=list)
    
    @property
    def error_count(self) -> int:
        """Total number of brand coupling findings."""
        return len(self.findings)
    
    @property
    def error_summary(self) -> Dict[str, int]:
        """Summary of findings by error code."""
        summary: Dict[str, int] = {}
        for finding in self.findings:
            code = finding.error_code.value
            summary[code] = summary.get(code, 0) + 1
        return summary


# Known brand domains to detect in URLs
BRAND_DOMAINS = [
    'skillhub.com',
    'skillupitacademy.com',
    'realtutorialhub.com',
    'skillupit.com',
]

# Known brand names (for trademark detection in code)
BRAND_NAMES = [
    'SkillHub',
    'Skill Hub',
    'SkillUpIT',
    'Skill Up IT',
    'Real Tutorial Hub',
    'RealTutorialHub',
]

# Brand-specific font families
BRAND_FONTS = [
    'Poppins',
    'Inter',
    'Roboto',
    'Open Sans',
]


def verify_brand_independence(
    file_path: Path,
    repository_root: Path,
    snapshot: Optional[Dict[str, Any]] = None
) -> BrandVerificationResult:
    """
    Verify that a file is brand-independent.
    
    Scans the file for brand coupling patterns and provides specific findings
    with line numbers, error codes, and recommendations.
    
    Args:
        file_path: Path to the file to verify
        repository_root: Root path of the repository
        snapshot: Optional TypeScript discovery snapshot for evidence IDs
    
    Returns:
        BrandVerificationResult with detailed findings
    """
    relative_path = file_path.relative_to(repository_root) if file_path.is_absolute() else file_path
    
    if not file_path.exists():
        return BrandVerificationResult(
            file_path=str(relative_path),
            passed=False,
            findings=[BrandFinding(
                file_path=str(relative_path),
                line_number=0,
                error_code=BrandErrorCode.BRAND_HARDCODED_COLOR,
                description="File not found",
                actual_value="",
                recommendation="Verify file path is correct"
            )]
        )
    
    try:
        content = file_path.read_text(encoding='utf-8')
    except Exception as e:
        return BrandVerificationResult(
            file_path=str(relative_path),
            passed=False,
            findings=[BrandFinding(
                file_path=str(relative_path),
                line_number=0,
                error_code=BrandErrorCode.BRAND_HARDCODED_COLOR,
                description=f"Failed to read file: {str(e)}",
                actual_value="",
                recommendation="Verify file is readable and has valid encoding"
            )]
        )
    
    findings: List[BrandFinding] = []
    lines = content.split('\n')
    
    # Scan for brand coupling patterns
    findings.extend(_scan_hardcoded_colors(lines, str(relative_path)))
    findings.extend(_scan_hardcoded_logos(lines, str(relative_path)))
    findings.extend(_scan_hardcoded_urls(lines, str(relative_path)))
    findings.extend(_scan_hardcoded_fonts(lines, str(relative_path)))
    findings.extend(_scan_hardcoded_brand_ids(lines, str(relative_path)))
    findings.extend(_scan_hardcoded_assets(lines, str(relative_path)))
    findings.extend(_scan_trademark_text(lines, str(relative_path)))
    
    # Check if file is theme-aware (positive signal)
    theme_patterns_found = _detect_theme_patterns(content)
    is_theme_aware = len(theme_patterns_found) > 0
    
    # Collect evidence IDs if snapshot provided
    evidence_ids: List[str] = []
    if snapshot:
        evidence = _find_evidence_by_path(str(relative_path), snapshot)
        if evidence and 'evidenceId' in evidence:
            evidence_ids.append(evidence['evidenceId'])
    
    return BrandVerificationResult(
        file_path=str(relative_path),
        passed=len(findings) == 0,
        findings=findings,
        is_theme_aware=is_theme_aware,
        theme_patterns_found=theme_patterns_found,
        evidence_ids=evidence_ids
    )


def _scan_hardcoded_colors(lines: List[str], file_path: str) -> List[BrandFinding]:
    """Scan for hard-coded color values (not CSS variables)."""
    findings: List[BrandFinding] = []
    
    # Patterns for hard-coded colors
    color_patterns = [
        # Hex colors: #rgb, #rrggbb, #rrggbbaa
        (r'#[0-9A-Fa-f]{3,8}(?!["\'])', 'hex color', 'Use CSS variable: var(--color-primary)'),
        # rgb/rgba colors
        (r'rgb\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)', 'rgb color', 'Use CSS variable: var(--color-primary)'),
        (r'rgba\s*\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)', 'rgba color', 'Use CSS variable: var(--color-primary-alpha)'),
        # hsl/hsla colors
        (r'hsl\s*\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*\)', 'hsl color', 'Use CSS variable: var(--color-primary)'),
        (r'hsla\s*\(\s*\d+\s*,\s*\d+%\s*,\s*\d+%\s*,\s*[\d.]+\s*\)', 'hsla color', 'Use CSS variable: var(--color-primary-alpha)'),
    ]
    
    for line_num, line in enumerate(lines, start=1):
        # Skip lines that are comments
        if line.strip().startswith('//') or line.strip().startswith('/*') or line.strip().startswith('*'):
            continue
        
        # Skip lines with CSS variable usage (these are ALLOWED)
        if 'var(--' in line:
            continue
        
        # Skip lines with Tailwind classes (these are ALLOWED)
        if 'className=' in line or 'class=' in line:
            # Check if color is within className/class string
            # This is a heuristic - we're allowing Tailwind, but not style={{color: '#xxx'}}
            continue
        
        for pattern, color_type, recommendation in color_patterns:
            matches = list(re.finditer(pattern, line, re.IGNORECASE))
            for match in matches:
                # Additional check: skip if part of URL or comment
                if 'http' in line[:match.start()] or '//' in line[:match.start()]:
                    continue
                
                findings.append(BrandFinding(
                    file_path=file_path,
                    line_number=line_num,
                    error_code=BrandErrorCode.BRAND_HARDCODED_COLOR,
                    description=f"Hard-coded {color_type}",
                    actual_value=match.group(),
                    recommendation=recommendation,
                    context=line.strip()
                ))
    
    return findings


def _scan_hardcoded_logos(lines: List[str], file_path: str) -> List[BrandFinding]:
    """Scan for hard-coded logo paths or imports."""
    findings: List[BrandFinding] = []
    
    # Patterns for logo references
    logo_patterns = [
        (r'["\'][^"\']*logo[^"\']*\.(png|jpg|jpeg|svg|gif)["\']', 'logo image path'),
        (r'import\s+\w+\s+from\s+["\'][^"\']*logo[^"\']*["\']', 'logo import statement'),
        (r'require\(["\'][^"\']*logo[^"\']*["\']\)', 'logo require statement'),
    ]
    
    for line_num, line in enumerate(lines, start=1):
        # Skip comments
        if line.strip().startswith('//') or line.strip().startswith('/*'):
            continue
        
        # Allow if using props or config (data-driven)
        if 'logoUrl' in line or 'brandConfig' in line or '{logo}' in line:
            continue
        
        for pattern, description in logo_patterns:
            matches = list(re.finditer(pattern, line, re.IGNORECASE))
            for match in matches:
                findings.append(BrandFinding(
                    file_path=file_path,
                    line_number=line_num,
                    error_code=BrandErrorCode.BRAND_HARDCODED_LOGO,
                    description=f"Hard-coded {description}",
                    actual_value=match.group(),
                    recommendation="Use prop or config: logoUrl={brandConfig.logoUrl}",
                    context=line.strip()
                ))
    
    return findings


def _scan_hardcoded_urls(lines: List[str], file_path: str) -> List[BrandFinding]:
    """Scan for hard-coded brand-specific URLs."""
    findings: List[BrandFinding] = []
    
    for line_num, line in enumerate(lines, start=1):
        # Skip comments
        if line.strip().startswith('//') or line.strip().startswith('/*'):
            continue
        
        # Check for brand domains
        for domain in BRAND_DOMAINS:
            if domain in line.lower():
                # Make sure it's in a URL context
                if 'http://' in line.lower() or 'https://' in line.lower() or 'www.' in line.lower():
                    # Extract the URL
                    url_match = re.search(r'https?://[^\s"\'<>]+', line, re.IGNORECASE)
                    if url_match:
                        findings.append(BrandFinding(
                            file_path=file_path,
                            line_number=line_num,
                            error_code=BrandErrorCode.BRAND_HARDCODED_URL,
                            description="Hard-coded brand URL",
                            actual_value=url_match.group(),
                            recommendation="Use environment variable or config: baseUrl={process.env.NEXT_PUBLIC_BASE_URL}",
                            context=line.strip()
                        ))
                        break  # One finding per line
    
    return findings


def _scan_hardcoded_fonts(lines: List[str], file_path: str) -> List[BrandFinding]:
    """Scan for hard-coded font-family values (not CSS variables)."""
    findings: List[BrandFinding] = []
    
    for line_num, line in enumerate(lines, start=1):
        # Skip comments
        if line.strip().startswith('//') or line.strip().startswith('/*'):
            continue
        
        # Skip if using CSS variable
        if 'var(--font' in line:
            continue
        
        # Look for font-family declarations
        if 'font-family' in line.lower() or 'fontFamily' in line:
            # Check for brand-specific fonts
            for font in BRAND_FONTS:
                if font in line:
                    findings.append(BrandFinding(
                        file_path=file_path,
                        line_number=line_num,
                        error_code=BrandErrorCode.BRAND_HARDCODED_FONT,
                        description="Hard-coded font-family",
                        actual_value=font,
                        recommendation="Use CSS variable: font-family: var(--font-heading)",
                        context=line.strip()
                    ))
                    break  # One finding per line
    
    return findings


def _scan_hardcoded_brand_ids(lines: List[str], file_path: str) -> List[BrandFinding]:
    """Scan for hard-coded brand ID values in code."""
    findings: List[BrandFinding] = []
    
    # Patterns for brand ID references
    brand_id_patterns = [
        (r'brandId\s*[:=]\s*["\']([^"\']+)["\']', 'brandId assignment'),
        (r'brand\s*===\s*["\']([^"\']+)["\']', 'brand comparison'),
        (r'brand\s*==\s*["\']([^"\']+)["\']', 'brand comparison'),
        (r'\{\s*brand\s*:\s*["\']([^"\']+)["\']\s*\}', 'brand object property'),
    ]
    
    for line_num, line in enumerate(lines, start=1):
        # Skip comments
        if line.strip().startswith('//') or line.strip().startswith('/*'):
            continue
        
        # Skip type definitions and interfaces (these are allowed to reference brand IDs)
        if 'type ' in line or 'interface ' in line or 'enum ' in line:
            continue
        
        for pattern, description in brand_id_patterns:
            matches = list(re.finditer(pattern, line, re.IGNORECASE))
            for match in matches:
                brand_value = match.group(1) if len(match.groups()) > 0 else match.group()
                findings.append(BrandFinding(
                    file_path=file_path,
                    line_number=line_num,
                    error_code=BrandErrorCode.BRAND_HARDCODED_ID,
                    description=f"Hard-coded {description}",
                    actual_value=brand_value,
                    recommendation="Use prop or context: brand={currentBrand}",
                    context=line.strip()
                ))
    
    return findings


def _scan_hardcoded_assets(lines: List[str], file_path: str) -> List[BrandFinding]:
    """Scan for hard-coded brand-specific asset paths."""
    findings: List[BrandFinding] = []
    
    # Patterns for brand-specific asset paths
    brand_asset_patterns = [
        (r'["\'][^"\']*/(skillhub|suia|rth|realtutorialhub)[^"\']*\.(png|jpg|jpeg|svg|gif|ico)["\']', 'brand-specific asset path'),
        (r'/images/brands/[^"\']+', 'brand image directory path'),
    ]
    
    for line_num, line in enumerate(lines, start=1):
        # Skip comments
        if line.strip().startswith('//') or line.strip().startswith('/*'):
            continue
        
        # Allow if using brandConfig or props
        if 'brandConfig' in line or 'assetUrl' in line:
            continue
        
        for pattern, description in brand_asset_patterns:
            matches = list(re.finditer(pattern, line, re.IGNORECASE))
            for match in matches:
                findings.append(BrandFinding(
                    file_path=file_path,
                    line_number=line_num,
                    error_code=BrandErrorCode.BRAND_HARDCODED_ASSET,
                    description=f"Hard-coded {description}",
                    actual_value=match.group(),
                    recommendation="Use brand config: src={brandConfig.assets[assetKey]}",
                    context=line.strip()
                ))
    
    return findings


def _scan_trademark_text(lines: List[str], file_path: str) -> List[BrandFinding]:
    """Scan for trademarked brand text in code (not UI content)."""
    findings: List[BrandFinding] = []
    
    for line_num, line in enumerate(lines, start=1):
        # Skip comments (brand names in comments are OK)
        if line.strip().startswith('//') or line.strip().startswith('/*'):
            continue
        
        # Skip if in UI content context (props, content, text, title, etc.)
        # We're looking for brand names in CODE, not in UI strings
        if any(keyword in line for keyword in ['content=', 'text=', 'title=', 'label=', 'placeholder=', 'description=']):
            continue
        
        # Check for brand names
        for brand_name in BRAND_NAMES:
            if brand_name in line:
                # Make sure it's in a string literal (not a variable name or comment)
                if f'"{brand_name}"' in line or f"'{brand_name}'" in line:
                    findings.append(BrandFinding(
                        file_path=file_path,
                        line_number=line_num,
                        error_code=BrandErrorCode.BRAND_TRADEMARK_TEXT,
                        description="Trademarked brand text in code",
                        actual_value=brand_name,
                        recommendation="Use brand config: brandName={brandConfig.name}",
                        context=line.strip()
                    ))
                    break  # One finding per line
    
    return findings


def _detect_theme_patterns(content: str) -> List[str]:
    """Detect theme-aware patterns in the file (positive signals)."""
    theme_patterns = [
        (r'var\(--[^)]+\)', 'CSS variable usage'),
        (r'theme\.[a-zA-Z]+', 'Theme object access'),
        (r'className=["\'][^"\']*(?:primary|secondary|accent)[^"\']*["\']', 'Tailwind theme classes'),
        (r'bg-(?:primary|secondary|accent)-\d+', 'Tailwind color classes'),
        (r'text-(?:primary|secondary|accent)-\d+', 'Tailwind text classes'),
        (r'brandConfig', 'Brand config usage'),
        (r'themeConfig', 'Theme config usage'),
    ]
    
    found_patterns: List[str] = []
    for pattern, description in theme_patterns:
        if re.search(pattern, content):
            found_patterns.append(description)
    
    return found_patterns


def _find_evidence_by_path(file_path: str, snapshot: Dict[str, Any]) -> Optional[Dict[str, Any]]:
    """Find evidence entry for a file path in the snapshot."""
    # Search through D1 (structure) evidence
    d1_data = snapshot.get('structure', {})
    if 'evidence' in d1_data:
        for evidence in d1_data['evidence']:
            if evidence.get('path') == file_path or file_path in evidence.get('path', ''):
                return evidence
    
    # Search through D3 (blocks) evidence
    blocks_data = snapshot.get('blocks', {})
    if 'evidence' in blocks_data:
        for evidence in blocks_data['evidence']:
            if evidence.get('path') == file_path or file_path in evidence.get('path', ''):
                return evidence
    
    # Search through D4 (composer) evidence
    composer_data = snapshot.get('composer', {})
    if 'evidence' in composer_data:
        for evidence in composer_data['evidence']:
            if evidence.get('path') == file_path or file_path in evidence.get('path', ''):
                return evidence
    
    return None


def format_findings_report(results: List[BrandVerificationResult]) -> str:
    """
    Format brand verification results into a human-readable report.
    
    Args:
        results: List of verification results
    
    Returns:
        Formatted report string
    """
    report_lines = ["# Brand Independence Verification Report\n"]
    
    total_files = len(results)
    passed_files = sum(1 for r in results if r.passed)
    failed_files = total_files - passed_files
    total_findings = sum(r.error_count for r in results)
    
    report_lines.append(f"**Summary:** {passed_files}/{total_files} files passed, {total_findings} finding(s)\n")
    
    if failed_files == 0:
        report_lines.append("✅ All files are brand-independent!\n")
        return "\n".join(report_lines)
    
    report_lines.append(f"\n## ❌ Failed Files ({failed_files})\n")
    
    for result in results:
        if not result.passed:
            report_lines.append(f"\n### {result.file_path}")
            report_lines.append(f"**Findings:** {result.error_count}")
            
            if result.is_theme_aware:
                report_lines.append(f"✅ **Theme-aware:** {', '.join(result.theme_patterns_found)}")
            
            report_lines.append("")
            
            for finding in result.findings:
                report_lines.append(f"- **Line {finding.line_number}:** {finding.description}")
                report_lines.append(f"  - **Found:** `{finding.actual_value}`")
                report_lines.append(f"  - **Fix:** {finding.recommendation}")
                if finding.context:
                    report_lines.append(f"  - **Context:** `{finding.context[:80]}...`")
                report_lines.append("")
    
    return "\n".join(report_lines)
