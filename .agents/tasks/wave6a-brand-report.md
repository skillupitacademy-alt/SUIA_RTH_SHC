# Wave 6A: Brand Independence Verification — Implementation Report

**Completed:** 2025-01-29  
**Branch:** `m2-project-ai-foundation`  
**Commit:** [To be committed]

---

## Overview

Implemented Wave 6A brand independence verification. Created comprehensive brand coupling detection system that scans candidate files for hard-coded brand dependencies (colors, logos, URLs, fonts, brand IDs) while allowing design tokens and theme-based styling. All certification gates now include brand independence verification with specific error codes and detailed findings.

---

## What Was Changed

### TASK: Brand Independence Verification Module

**Files Created:**
- `services/project-ai/app/verification/brand.py` — Brand coupling detection (626 lines)

**Files Extended:**
- `services/project-ai/app/verification/__init__.py` — Added brand verification exports
- `services/project-ai/app/certification/gates.py` — Refactored `execute_brand_independence_gate()` to use new module
- `services/project-ai/tests/test_certification_gates.py` — Added 8 comprehensive Wave 6A tests

---

## Brand Independence Principles

### ✅ ALLOWED (Design Tokens & Theme-Based)

```typescript
// CSS variables
const color = 'var(--color-primary)';
backgroundColor: 'var(--color-secondary)';
fontFamily: 'var(--font-heading)';

// Theme object access
const primary = theme.colors.primary;
const spacing = theme.spacing.md;

// Tailwind classes
className="bg-primary-500 text-secondary-700"

// Props/data-driven
<img src={logoUrl} />
<a href={baseUrl} />
color={theme.primary}

// Conditional brand logic
const logo = brandConfig[brand].logoUrl;
```

### ❌ BRAND COUPLING (Hard-Coded Values)

```typescript
// Hard-coded colors
const color = '#FF5A00';              // FAIL
backgroundColor: 'rgb(255, 90, 0)';   // FAIL
style={{ color: 'hsl(20, 100%, 50%)' }};  // FAIL

// Hard-coded logos
import logo from './skillhub-logo.png';  // FAIL
<img src="/images/logo.svg" />           // FAIL

// Hard-coded URLs
const url = 'https://skillhub.com';   // FAIL

// Hard-coded fonts
fontFamily: 'Poppins, sans-serif';    // FAIL

// Hard-coded brand IDs
const config = { brandId: 'skillhub' };  // FAIL
if (brand === 'realtutorialhub') { }     // FAIL
```

---

## Brand Verification Error Codes

The system detects 7 types of brand coupling:

1. **BRAND_HARDCODED_COLOR** — Hard-coded color values (#rgb, rgb(), rgba(), hsl(), hsla())
2. **BRAND_HARDCODED_LOGO** — Hard-coded logo paths or import statements
3. **BRAND_HARDCODED_URL** — Hard-coded brand-specific URLs (domains from known list)
4. **BRAND_HARDCODED_FONT** — Hard-coded font-family values (not CSS variables)
5. **BRAND_HARDCODED_ID** — Hard-coded brand ID values in code
6. **BRAND_HARDCODED_ASSET** — Hard-coded brand-specific asset paths
7. **BRAND_TRADEMARK_TEXT** — Trademarked brand text in code (not UI content)

---

## Brand Verification Flow

```
Candidate File
        ↓
Python Certification Gate: execute_brand_independence_gate()
        ↓
For each candidate file:
        ↓
    Call verify_brand_independence()
        ↓
        Read file content
        ↓
        Scan for 7 brand coupling patterns:
            - Hard-coded colors (skip if CSS variable)
            - Hard-coded logos (skip if props/config)
            - Hard-coded URLs (check against brand domain list)
            - Hard-coded fonts (skip if CSS variable)
            - Hard-coded brand IDs (skip type definitions)
            - Hard-coded assets (skip if brandConfig)
            - Trademark text (skip UI content context)
        ↓
        For each finding:
            - Record file path
            - Record line number
            - Record error code
            - Record actual value
            - Record recommendation
            - Record context (surrounding code)
        ↓
        Detect theme patterns (positive signals):
            - CSS variable usage
            - Theme object access
            - Tailwind theme classes
            - Brand config usage
        ↓
        Collect evidence IDs from snapshot
        ↓
        Return BrandVerificationResult
        ↓
    Aggregate findings to blockers list
        ↓
Return GateExecutionResult (PASS/FAIL)
```

---

## Implementation Details

### 1. Brand Verification Module (`brand.py`)

**Purpose:** Comprehensive brand coupling detection with specific findings

**Key Classes:**
- `BrandErrorCode` — 7 error codes for brand coupling types
- `BrandFinding` — Single finding with file, line, error code, value, recommendation
- `BrandVerificationResult` — Result for one file with findings, theme awareness, evidence

**Key Functions:**
- `verify_brand_independence()` — Main entry point for file verification
- `_scan_hardcoded_colors()` — Detect hex, rgb, rgba, hsl, hsla (not CSS variables)
- `_scan_hardcoded_logos()` — Detect logo imports and paths
- `_scan_hardcoded_urls()` — Detect brand domain URLs
- `_scan_hardcoded_fonts()` — Detect font-family (not CSS variables)
- `_scan_hardcoded_brand_ids()` — Detect brand ID assignments and comparisons
- `_scan_hardcoded_assets()` — Detect brand-specific asset paths
- `_scan_trademark_text()` — Detect brand names in code (not UI)
- `_detect_theme_patterns()` — Detect positive signals (CSS vars, theme, Tailwind)
- `format_findings_report()` — Human-readable report formatter

**Known Brand Domains:**
- skillhub.com
- skillupitacademy.com
- realtutorialhub.com
- skillupit.com

**Known Brand Fonts:**
- Poppins
- Inter
- Roboto
- Open Sans

### 2. Gate Integration (`gates.py`)

**Refactored `execute_brand_independence_gate()`:**
- Delegates to `verify_brand_independence()` for each file
- Collects findings and converts to blockers
- Includes file path, line number, error description, and recommendation in each blocker
- Returns PASS if no findings, FAIL with detailed blockers if findings detected

### 3. Comprehensive Tests

**8 New Wave 6A Tests:**
1. `test_brand_gate_detects_hardcoded_logo` — Logo path detection
2. `test_brand_gate_detects_hardcoded_url` — Brand URL detection
3. `test_brand_gate_detects_hardcoded_font` — Font-family detection
4. `test_brand_gate_detects_hardcoded_brand_id` — Brand ID in code detection
5. `test_brand_gate_allows_design_tokens` — CSS variables and theme tokens allowed
6. `test_brand_gate_detects_multiple_violations` — Multiple findings in one file
7. `test_brand_gate_provides_specific_line_numbers` — Line number accuracy
8. `test_brand_gate_verifies_multiple_files` — Multi-file verification

---

## Test Results

### All Tests Passing ✅

```
141 passed, 4 skipped in 22.94s
```

**Breakdown:**
- 10 brand independence tests (2 existing + 8 new Wave 6A)
- All existing tests remain passing (no regressions)
- 4 skipped tests are expected (snapshot-dependent integration tests)

**Wave 6A Test Evidence:**

```python
def test_brand_gate_detects_hardcoded_logo():
    """Brand gate detects hard-coded logo paths."""
    test_file.write_text('import logo from "./assets/skillhub-logo.png";')
    result = executor.execute_brand_independence_gate(['LogoComponent.tsx'])
    assert result.status == CertificationGateStatus.FAIL
    assert any('logo' in b.lower() for b in result.blockers)
    # ✅ PASS

def test_brand_gate_detects_hardcoded_url():
    """Brand gate detects hard-coded brand URLs."""
    test_file.write_text('const url = "https://skillhub.com/courses";')
    result = executor.execute_brand_independence_gate(['LinkComponent.tsx'])
    assert result.status == CertificationGateStatus.FAIL
    assert any('url' in b.lower() for b in result.blockers)
    # ✅ PASS

def test_brand_gate_allows_design_tokens():
    """Brand gate allows CSS variables and design tokens."""
    test_file.write_text("""
        const styles = {
            color: 'var(--color-primary)',
            backgroundColor: 'var(--color-secondary)',
            fontFamily: 'var(--font-heading)'
        };
    """)
    result = executor.execute_brand_independence_gate(['TokenComponent.tsx'])
    assert result.status == CertificationGateStatus.PASS
    assert len(result.blockers) == 0
    # ✅ PASS

def test_brand_gate_detects_multiple_violations():
    """Brand gate detects multiple violations in a single file."""
    test_file.write_text("""
        const color = '#FF5733';
        const logo = '/images/skillhub-logo.png';
        const url = 'https://skillhub.com';
        const font = { fontFamily: 'Poppins' };
        const config = { brandId: 'skillhub' };
    """)
    result = executor.execute_brand_independence_gate(['MultiViolation.tsx'])
    assert result.status == CertificationGateStatus.FAIL
    assert len(result.blockers) >= 4  # At least color, logo, url, brand
    # ✅ PASS
```

---

## Architecture Compliance

### ✅ TypeScript-Python Boundary Preserved
- Python orchestrates brand verification workflow
- Python reads TypeScript-generated snapshot for evidence IDs
- No reimplementation of discovery logic in Python
- Evidence IDs from TypeScript discovery only

### ✅ Safety Invariants Enforced
- No arbitrary shell execution
- File reading with proper encoding
- Exception handling for unreadable files
- No credentials in evidence output

### ✅ Evidence Integrity
- Evidence IDs from TS discovery only (no synthetic IDs)
- Returns detailed findings with file path, line number, context
- Never converts uncertainty to PASS
- Evidence traceable to repository facts

### ✅ Error Code Specificity
- 7 distinct brand coupling error codes
- Each finding includes:
  - File path
  - Line number
  - Error code
  - Actual value found
  - Recommendation for fix
  - Surrounding code context

### ✅ Canonical Artifact Policy Followed
- Searched repository before creating brand.py
- Extended existing `verification/` directory
- Extended existing `gates.py` (not recreated)
- Extended existing test file (not created new test file)
- Documented integration points

---

## Files Modified Summary

### Created (1 file)
- `services/project-ai/app/verification/brand.py` (626 lines)

### Extended (3 files)
- `services/project-ai/app/verification/__init__.py` (+7 lines)
- `services/project-ai/app/certification/gates.py` (refactored method, -58 +35 lines)
- `services/project-ai/tests/test_certification_gates.py` (+154 lines)

### Report (1 file)
- `.agents/tasks/wave6a-brand-report.md` (this file)

**Total:** 822 lines added/modified across 5 files

---

## Verification Against Task Requirements

### ✅ REQUIRED: Search for Existing Brand Verification
**Requirement:** Search for any existing brand verification before creating

**Status:** COMPLETE
- ✓ Searched `services/project-ai/app/verification/brand.py` (did not exist)
- ✓ Searched for brand verification imports (none found)
- ✓ Found existing inline regex in `gates.py` (simple patterns only)
- ✓ Confirmed need for dedicated comprehensive module

### ✅ REQUIRED: Brand Independence Verification Module
**Requirement:** Create/extend verification/brand.py with comprehensive checks

**Status:** COMPLETE — Detects:
- ✓ Hard-coded colors (hex, rgb, rgba, hsl, hsla) not using CSS variables
- ✓ Hard-coded logo paths and imports
- ✓ Hard-coded brand URLs (known domain list)
- ✓ Hard-coded font-family values (not CSS variables)
- ✓ Hard-coded brand IDs in code
- ✓ Hard-coded brand assets
- ✓ Trademarked brand text in code (not UI)

### ✅ REQUIRED: Critical Distinction
**Requirement:** CSS variables allowed, hard-coded values fail

**Status:** COMPLETE
- ✓ `var(--color-primary)` → ALLOWED
- ✓ `theme.colors.primary` → ALLOWED
- ✓ `className="bg-primary-500"` → ALLOWED (Tailwind)
- ✓ `#FF5A00` → BRAND COUPLING → FAIL
- ✓ `"Poppins"` → BRAND COUPLING → FAIL
- ✓ `"skillhub.com"` → BRAND COUPLING → FAIL

### ✅ REQUIRED: Detailed Findings
**Requirement:** Output findings with file path, line number, type, value, recommendation

**Status:** COMPLETE
- ✓ File path recorded
- ✓ Line number calculated accurately
- ✓ Error code (7 types) assigned
- ✓ Actual value extracted
- ✓ Recommendation provided
- ✓ Code context captured

### ✅ REQUIRED: Integration with Certification Gates
**Requirement:** Wire into BRAND_INDEPENDENCE gate in gates.py

**Status:** COMPLETE
- ✓ Refactored `execute_brand_independence_gate()` to use brand.py
- ✓ Delegates to `verify_brand_independence()` for each file
- ✓ Converts findings to blockers with detailed messages
- ✓ Returns `GateExecutionResult` with PASS/FAIL/BLOCKED status
- ✓ Collects evidence IDs from TypeScript discovery

### ✅ REQUIRED: Comprehensive Tests
**Requirement:** Test each coupling type and clean candidates

**Status:** COMPLETE — 10 tests covering:
- ✓ Hard-coded color detected (existing test)
- ✓ CSS variable allowed (existing test)
- ✓ Hard-coded logo detected (new Wave 6A)
- ✓ Hard-coded URL detected (new Wave 6A)
- ✓ Hard-coded font detected (new Wave 6A)
- ✓ Hard-coded brand ID detected (new Wave 6A)
- ✓ Design tokens allowed (new Wave 6A)
- ✓ Multiple violations detected (new Wave 6A)
- ✓ Line numbers accurate (new Wave 6A)
- ✓ Multiple files verified (new Wave 6A)

### ✅ REQUIRED: Run All Existing Tests
**Requirement:** Verify no regressions

**Status:** COMPLETE
- ✓ 141 tests pass (131 existing + 10 brand)
- ✓ No test failures
- ✓ No regressions introduced
- ✓ 4 skipped tests (expected, snapshot-dependent)

---

## Key Improvements

### Before Wave 6A
```python
# Simple regex patterns inline in gates.py
brand_coupling_patterns = [
    (r'#[0-9A-Fa-f]{3,8}(?!["\'])', 'hard-coded hex color'),
    (r'rgb\s*\([^)]+\)', 'hard-coded rgb color'),
    # ... limited patterns
]

# No dedicated error codes
# No line number accuracy
# No detailed recommendations
# No theme awareness detection
```

### After Wave 6A
```python
# Comprehensive brand verification module
from app.verification.brand import (
    verify_brand_independence,
    BrandErrorCode,
    BrandFinding,
    BrandVerificationResult
)

# Verify file
result = verify_brand_independence(
    file_path=Path('Component.tsx'),
    repository_root=repository_root,
    snapshot=snapshot
)

# Detailed findings
for finding in result.findings:
    print(f"{finding.file_path}:{finding.line_number}")
    print(f"  Error: {finding.error_code}")
    print(f"  Found: {finding.actual_value}")
    print(f"  Fix: {finding.recommendation}")
    print(f"  Context: {finding.context}")

# Theme awareness detection
if result.is_theme_aware:
    print(f"Theme patterns: {result.theme_patterns_found}")
```

---

## Evidence of Real Implementation

### Test Evidence: Hard-Coded Logo Detection

```python
def test_brand_gate_detects_hardcoded_logo(self, mock_snapshot_valid, repository_root):
    """Brand gate detects hard-coded logo paths."""
    test_file = repository_root / "LogoComponent.tsx"
    test_file.write_text(
        'import logo from "./assets/skillhub-logo.png";\nconst img = "/images/logo.svg";',
        encoding='utf-8'
    )
    
    executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
    result = executor.execute_brand_independence_gate(['LogoComponent.tsx'])
    
    assert result.status == CertificationGateStatus.FAIL
    assert len(result.blockers) > 0
    assert any('logo' in b.lower() for b in result.blockers)
    # ✅ PASS
```

### Test Evidence: Design Tokens Allowed

```python
def test_brand_gate_allows_design_tokens(self, mock_snapshot_valid, repository_root):
    """Brand gate allows CSS variables and design tokens."""
    test_file = repository_root / "TokenComponent.tsx"
    test_file.write_text(
        """
        const styles = {
            color: 'var(--color-primary)',
            backgroundColor: 'var(--color-secondary)',
            fontFamily: 'var(--font-heading)'
        };
        const theme = theme.colors.primary;
        """,
        encoding='utf-8'
    )
    
    # Add evidence
    mock_snapshot_valid.setdefault('structure', {}).setdefault('evidence', []).append({
        'evidenceId': 'ev-token-001',
        'kind': 'component',
        'path': 'TokenComponent.tsx'
    })
    
    executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
    result = executor.execute_brand_independence_gate(['TokenComponent.tsx'])
    
    assert result.status == CertificationGateStatus.PASS
    assert len(result.blockers) == 0
    assert len(result.evidence_ids) > 0
    # ✅ PASS
```

### Test Evidence: Multiple Violations

```python
def test_brand_gate_detects_multiple_violations(self, mock_snapshot_valid, repository_root):
    """Brand gate detects multiple violations in a single file."""
    test_file = repository_root / "MultiViolation.tsx"
    test_file.write_text(
        """
        const color = '#FF5733';
        const logo = '/images/skillhub-logo.png';
        const url = 'https://skillhub.com';
        const font = { fontFamily: 'Poppins' };
        const config = { brandId: 'skillhub' };
        """,
        encoding='utf-8'
    )
    
    executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
    result = executor.execute_brand_independence_gate(['MultiViolation.tsx'])
    
    assert result.status == CertificationGateStatus.FAIL
    # Should detect multiple types of violations
    assert len(result.blockers) >= 4  # At least color, logo, url, brand
    # ✅ PASS
```

### Test Evidence: Line Number Accuracy

```python
def test_brand_gate_provides_specific_line_numbers(self, mock_snapshot_valid, repository_root):
    """Brand gate provides specific line numbers for findings."""
    test_file = repository_root / "LineNumbers.tsx"
    test_file.write_text(
        "line 1\nline 2\nconst color = '#FF5733';\nline 4\n",
        encoding='utf-8'
    )
    
    executor = CertificationGateExecutor(mock_snapshot_valid, repository_root)
    result = executor.execute_brand_independence_gate(['LineNumbers.tsx'])
    
    assert result.status == CertificationGateStatus.FAIL
    assert len(result.blockers) > 0
    # Should include line number in blocker message
    assert any(':3:' in b or 'Line 3' in b or 'line 3' in b for b in result.blockers)
    # ✅ PASS
```

---

## Integration Flow

```
Candidate Files (e.g., ["Component.tsx", "Block.tsx"])
        ↓
Python Certification Gate: execute_brand_independence_gate()
        ↓
For each candidate file:
        ↓
    1. Call verify_brand_independence()
        ↓
        Read file content
        ↓
        Scan for brand coupling:
            _scan_hardcoded_colors()
            _scan_hardcoded_logos()
            _scan_hardcoded_urls()
            _scan_hardcoded_fonts()
            _scan_hardcoded_brand_ids()
            _scan_hardcoded_assets()
            _scan_trademark_text()
        ↓
        Detect theme patterns (positive signals)
        ↓
        Collect evidence IDs from snapshot
        ↓
        Return BrandVerificationResult
        ↓
    2. Collect evidence IDs
        ↓
    3. For each finding, add to blockers:
        "file.tsx:42: Hard-coded hex color - #FF5733 (Fix: Use CSS variable: var(--color-primary))"
        ↓
Aggregate results
        ↓
Return GateExecutionResult (PASS if no blockers, FAIL with detailed findings if blockers)
```

---

## Example Findings Output

### Finding: Hard-Coded Color

```
Component.tsx:23: Hard-coded hex color - #FF5733 (Fix: Use CSS variable: var(--color-primary))
```

### Finding: Hard-Coded Logo

```
Header.tsx:15: Hard-coded logo import statement - import logo from "./assets/skillhub-logo.png" (Fix: Use prop or config: logoUrl={brandConfig.logoUrl})
```

### Finding: Hard-Coded URL

```
Footer.tsx:42: Hard-coded brand URL - https://skillhub.com (Fix: Use environment variable or config: baseUrl={process.env.NEXT_PUBLIC_BASE_URL})
```

### Finding: Hard-Coded Font

```
Typography.tsx:8: Hard-coded font-family - Poppins (Fix: Use CSS variable: font-family: var(--font-heading))
```

### Finding: Hard-Coded Brand ID

```
Config.tsx:12: Hard-coded brandId assignment - skillhub (Fix: Use prop or context: brand={currentBrand})
```

---

## Known Brand Assets

### Brand Domains (Detected in URLs)
- skillhub.com
- skillupitacademy.com
- realtutorialhub.com
- skillupit.com

### Brand Fonts (Detected in font-family)
- Poppins
- Inter
- Roboto
- Open Sans

### Brand Names (Detected in Code)
- SkillHub
- Skill Hub
- SkillUpIT
- Skill Up IT
- Real Tutorial Hub
- RealTutorialHub

---

## Next Steps (Wave 6B+)

1. **Wave 6B:** Theme compatibility verification with runtime theme switching
2. **Wave 7:** I2/I2-custom composition certification
3. **Wave 8+:** Production deployment workflow

---

## Canonical Artifact Compliance

✅ Searched extensively before creating new artifacts  
✅ Extended existing `verification/` directory  
✅ Extended existing `gates.py` (refactored method)  
✅ Extended existing test file (not created duplicate)  
✅ Created new brand.py module only after confirming none exists  
✅ Documented integration points  
✅ Followed canonical artifact policy at `.agents/policies/canonical-artifact-policy.md`

---

## Commit Message (Suggested)

```
feat(wave6a): brand independence verification with 7 error codes

- Create verification/brand.py for comprehensive brand coupling detection
- Detect 7 types of brand coupling: colors, logos, URLs, fonts, IDs, assets, trademarks
- Allow CSS variables, design tokens, and theme-based styling
- Provide detailed findings with file path, line number, and recommendations
- Refactor execute_brand_independence_gate() to use new module
- Add 8 comprehensive Wave 6A tests (all passing)
- All 141 tests pass (131 existing + 10 brand)

Brand coupling detection:
- Hard-coded colors (#rgb, rgb(), hsl()) vs CSS variables (var(--color-primary))
- Hard-coded logos vs props/config (logoUrl={brandConfig.logoUrl})
- Hard-coded URLs vs env vars (baseUrl={process.env.NEXT_PUBLIC_BASE_URL})
- Hard-coded fonts vs CSS variables (var(--font-heading))
- Hard-coded brand IDs vs props (brand={currentBrand})

Evidence: Real evidence IDs from TS discovery, no synthetic IDs
Architecture: Python orchestrates, TypeScript provides repository facts
Safety: File reading with proper encoding, exception handling
```

---

## Conclusion

Wave 6A is **COMPLETE**. Brand independence verification is fully implemented:

1. ✅ Comprehensive brand coupling detection (7 error codes)
2. ✅ Detailed findings with file path, line number, value, recommendation
3. ✅ Critical distinction: CSS variables allowed, hard-coded values fail
4. ✅ Integration with certification gates
5. ✅ 8 comprehensive Wave 6A tests (all passing)
6. ✅ No regressions (all 141 tests pass)
7. ✅ Theme awareness detection (positive signals)
8. ✅ Evidence collection from TypeScript discovery
9. ✅ Known brand domains, fonts, and names
10. ✅ Human-readable report formatter

The brand independence gate now provides real verification of candidate blocks with specific, actionable findings for each type of brand coupling detected.

**Status:** Ready for Wave 6B (Theme Compatibility Verification with Runtime Theme Switching)
