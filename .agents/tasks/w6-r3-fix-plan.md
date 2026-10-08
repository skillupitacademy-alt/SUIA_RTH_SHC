# W6-R3 Test Regression Fix Plan

## Executive Summary

W6 successfully implemented two architectural remediations:
1. **UBRC/runtime-context remediation**: 12 Tutorial blocks now consume `runtimeContext` properly
2. **Theme remediation**: 39 hardcoded colors replaced with semantic theme tokens via `theme-utils.ts`

**Problem**: These architectural changes introduced 81 test regressions (from 58 baseline failures to 139 total failures).

**Root Cause**: Tests encode expectations about the OLD architecture (hardcoded colors, missing DOM attributes, old context prop shapes).

**Objective**: Fix all 81 regressions by migrating test assertions to match the NEW architecture, WITHOUT weakening test quality.

---

## W6 Changes Summary (from Evidence)

### A. UBRC Remediation - 12 Blocks Modified

All blocks now follow this pattern:

```typescript
// Extract runtime identity from runtimeContext with fallback
const blockId = runtimeContext?.blockId ?? block.id;
const blockType = runtimeContext?.blockType ?? 'block-type-name';
const blockVersion = runtimeContext?.blockVersion ?? block.version; // if applicable

// Apply as DOM attributes
<div 
  data-block-id={blockId} 
  data-block-type={blockType} 
  data-block-version={blockVersion}
>
```

**Blocks affected:**
1. `packages/ui/src/tutorial/blocks/HeadingBlock.tsx`
2. `packages/ui/src/tutorial/blocks/ParagraphBlock.tsx`
3. `packages/ui/src/tutorial/blocks/CalloutBlock.tsx`
4. `packages/ui/src/tutorial/blocks/ListBlock.tsx`
5. `packages/ui/src/tutorial/blocks/CodeBlock.tsx`
6. `packages/ui/src/tutorial/blocks/CardGridBlock.tsx`
7. `packages/ui/src/tutorial/blocks/ThreeColumnBlock.tsx`
8. `packages/ui/src/tutorial/blocks/TimelineBlock.tsx`
9. `packages/ui/src/tutorial/blocks/TwoColumnBlock.tsx`
10. `packages/ui/src/tutorial/blocks/CodeC1Block.tsx`
11. `packages/ui/src/tutorial/blocks/DefinitionBlock.tsx`
12. `packages/ui/src/tutorial/blocks/IntroductionBlock.tsx`

**Test Impact**: Any test asserting DOM structure, snapshot comparisons, or attribute presence needs updating.

### B. Theme Remediation - 39 Colors Replaced

**New Module Created**: `packages/ui/src/tutorial/theme-utils.ts`

**Exports**:
- `getThemeColor(theme, scale, shade)` - Safe semantic color accessor with Tailwind fallback
- `withAlpha(hex, alphaHex)` - Transparency helper
- `DEFAULT_THEME` - Full semantic palette

**Color Mapping Table** (39 hardcoded hex → semantic tokens):

#### CodeC1Block (28 colors replaced)

| Old Hex Value | New Semantic Token | Usage |
|--------------|-------------------|-------|
| `#07142f` | `getThemeColor(theme, 'slate', 900)` | Terminal background |
| `#172b52` | `getThemeColor(theme, 'slate', 800)` | Terminal border |
| `#f8fafc` | `getThemeColor(theme, 'slate', 50)` | Light text |
| `#ff5f57` | `getThemeColor(theme, 'rose', 500)` | Traffic light red |
| `#febc2e` | `getThemeColor(theme, 'amber', 400)` | Traffic light yellow |
| `#28c840` | `getThemeColor(theme, 'emerald', 500)` | Traffic light green |
| `#3b82f6` | `getThemeColor(theme, 'blue', 500)` | Primary blue accent |
| `#1e40af` | `getThemeColor(theme, 'blue', 800)` | Dark blue |
| `#0b1b3d` | `getThemeColor(theme, 'slate', 900)` | Deep background |
| `#079447` | `getThemeColor(theme, 'emerald', 600)` | Success green |
| `#effaf4` | `getThemeColor(theme, 'emerald', 50)` | Success bg light |
| `#bfe8d1` | `getThemeColor(theme, 'emerald', 200)` | Success bg medium |
| `#a56b00` | `getThemeColor(theme, 'amber', 700)` | Warning dark |
| `#fff9e9` | `getThemeColor(theme, 'amber', 50)` | Warning bg light |
| `#f4dba1` | `getThemeColor(theme, 'amber', 200)` | Warning bg medium |
| `#1554c7` | `getThemeColor(theme, 'blue', 600)` | Info blue |
| `#eef4ff` | `getThemeColor(theme, 'blue', 50)` | Info bg light |
| `#c9d9ff` | `getThemeColor(theme, 'blue', 200)` | Info bg medium |
| `#0d1d40` | `getThemeColor(theme, 'slate', 900)` | Dark terminal |
| `#d7e2f5` | `getThemeColor(theme, 'blue', 100)` | Light blue bg |
| `#dce5f8` | `getThemeColor(theme, 'blue', 100)` | Light blue bg alt |
| `#f6f8ff` | `getThemeColor(theme, 'blue', 50)` | Very light blue |
| `#fffaf0` | `getThemeColor(theme, 'amber', 50)` | Cream background |
| `#f0d9a2` | `getThemeColor(theme, 'amber', 200)` | Amber medium |
| `#f59e0b` | `getThemeColor(theme, 'amber', 500)` | Amber primary |
| `#d97706` | `getThemeColor(theme, 'amber', 600)` | Amber dark |
| `#d9e0ea` | `getThemeColor(theme, 'slate', 200)` | Light gray |
| `#f7f9fc` | `getThemeColor(theme, 'slate', 50)` | Off-white |

#### DefinitionBlock (7 colors replaced)

| Old Hex Value | New Semantic Token | Usage |
|--------------|-------------------|-------|
| `#f6f8ff` | `getThemeColor(theme, 'blue', 50)` | Example box bg |
| `#d2dcf0` | `getThemeColor(theme, 'blue', 200)` | Example box border |
| `#e0dce6` | `getThemeColor(theme, 'gray', 200)` | Card background |
| `#fffaf0` | `getThemeColor(theme, 'amber', 50)` | Takeaway bg light |
| `#ead8a8` | `getThemeColor(theme, 'amber', 200)` | Takeaway bg medium |
| `#f59e0b` | `getThemeColor(theme, 'amber', 500)` | Takeaway icon |
| `#d97706` | `getThemeColor(theme, 'amber', 600)` | Takeaway dark |

#### IntroductionBlock (4 colors replaced)

| Old Hex Value | New Semantic Token | Usage |
|--------------|-------------------|-------|
| `#e5e7eb` | `getThemeColor(theme, 'gray', 200)` | Flow card border |
| `#f9fafb` | `getThemeColor(theme, 'gray', 50)` | Flow card bg |
| `#6b7280` | `getThemeColor(theme, 'gray', 500)` | Muted text |
| `#0B132B` | `getThemeColor(theme, 'slate', 900)` | Code background |

**Test Impact**: Any test asserting specific hex color values must be updated to either:
- Assert the theme token usage pattern (preferred)
- Assert semantic color names rather than hex values
- Use theme-aware test fixtures

### C. Dark Mode Support Added

All blocks now include Tailwind `dark:` prefix classes for consistent dark mode:

```typescript
className="text-slate-900 dark:text-white"
className="bg-white dark:bg-slate-900"
className="border-slate-200 dark:border-slate-800"
```

**Test Impact**: Tests may need dark mode variants or theme context that includes dark mode flag.

---

## Test Regression Categories (81 failures)

Based on W6 implementation report:

### Category 1: Certification Gate Tests (16 failures)

**Module**: `services/project-ai/tests/certification/test_certification_gates.py`

#### Subcategory 1a: Runtime Verification Tests (4 failures)
- `test_runtime_gate_blocked_with_empty_snapshot`
- `test_runtime_gate_fails_with_missing_block`
- `test_runtime_gate_collects_evidence_ids`
- `test_runtime_gate_verifies_multiple_blocks`

**Likely Cause**: Tests may assert old snapshot structure or old block evidence format.

**Fix Strategy**: 
1. Read test expectations
2. Update mock snapshot fixtures to include new UBRC attributes (`data-block-id`, `data-block-type`, `data-block-version`)
3. Update evidence format expectations if runtime verifier now checks for theme tokens

#### Subcategory 1b: Browser Verification Tests (3 failures)
- `test_browser_gate_blocked_with_empty_snapshot`
- `test_browser_gate_collects_evidence_ids`
- `test_browser_gate_creates_screenshot_directory`

**Likely Cause**: Browser verifier expectations changed or new evidence IDs introduced.

**Fix Strategy**:
1. Check if browser verifier now expects UBRC DOM attributes
2. Update mock browser verification results to include new attribute checks
3. Verify evidence ID format matches new gate implementation

#### Subcategory 1c: Theme Compatibility Tests (9 failures)
- `test_theme_gate_passes_with_theme_aware_block`
- `test_theme_gate_fails_with_hardcoded_values`
- `test_theme_gate_fails_with_missing_theme_context`
- `test_theme_gate_detects_suia_theme`
- `test_theme_gate_detects_rth_theme`
- `test_theme_gate_blocked_without_themes`
- `test_theme_gate_detects_design_tokens`
- `test_theme_gate_verifies_multiple_blocks`
- `test_theme_gate_collects_evidence_ids`

**Likely Cause**: Theme gate now expects `getThemeColor()` usage instead of hardcoded hex. Tests may still assert old patterns.

**Fix Strategy**:
1. Update "theme-aware" test fixtures to use `getThemeColor()` pattern
2. Update "hardcoded values" test to recognize new acceptable patterns (`getThemeColor()` is good, raw hex is bad)
3. Update theme detection logic to recognize `theme-utils.ts` imports as theme-aware
4. Verify design token detection recognizes semantic color scales (slate, blue, emerald, amber, etc.)

### Category 2: Placement Executor Tests (3 failures)

**Module**: `services/project-ai/tests/.../test_placement.py`

- `test_executor_rejects_unapproved_manifest`
- `test_executor_verifies_manifest_hash`
- `test_executor_rejects_reject_decision`

**Likely Cause**: Manifest validation logic changed or approval enforcement added new checks.

**Fix Strategy**:
1. Check if manifest schema changed (new required fields for UBRC/theme evidence)
2. Update test manifests to include complete evidence IDs
3. Verify approval enforcement still works with new manifest structure

### Category 3: Other Regressions (62 failures)

**Status**: Not detailed in W6 report last 20 lines.

**Investigation Strategy**:
1. Run full test suite with verbose output: `cd services/project-ai && python -m pytest -v --tb=short | tee ../../.agents/tasks/w6-r3-test-output.txt`
2. Classify each failure into:
   - **DOM structure change**: Test expects old block output without UBRC attributes
   - **Color assertion**: Test expects hardcoded hex value
   - **Theme context missing**: Test doesn't provide theme prop to block
   - **Snapshot mismatch**: Snapshot needs regeneration after architectural change
   - **Mock fixture outdated**: Mock data doesn't match new schema
   - **Actual production bug**: The W6 implementation broke something

---

## Implementation Plan

### Phase 1: Diagnosis - Classify All 81 Failures

**Files to Touch**: None (read-only investigation)

**Steps**:
1. Run Python test suite with verbose output:
   ```bash
   cd e:\onlinewebsites\quiz-platform\services\project-ai
   python -m pytest -v --tb=short > ../../.agents/tasks/w6-r3-test-failures-detailed.txt 2>&1
   ```

2. Parse output to create failure classification spreadsheet:
   - Test name
   - Module
   - Failure type (assertion error, fixture error, import error)
   - Failure message excerpt
   - Recommended fix category

3. Create `w6-r3-failure-classification.json` with structured data

**Verification**: Classification file exists with all 81 failures categorized

**Estimated Scope**: ~10 minutes (automated parsing)

---

### Phase 2: Fix Certification Gate Tests (16 failures)

#### Task 2.1: Fix Runtime Gate Tests (4 failures)

**Files**:
- `services/project-ai/tests/certification/test_certification_gates.py` (update test expectations)
- `services/project-ai/tests/certification/conftest.py` or inline fixtures (update mock snapshots)

**Changes**:
1. Update `mock_snapshot_valid` fixture to include UBRC attributes in block evidence:
   ```python
   'blocks': {
       'verified': [
           {
               'blockType': 'introduction',
               'ubrcStatus': 'UBRC_VALID',
               'ubrcAttributes': ['data-block-id', 'data-block-type', 'data-block-version'],  # ADD
               'registered': True,
               'rendered': True,
               'evidenceId': 'ev-001'
           }
       ]
   }
   ```

2. If runtime gate checks for theme compliance, add theme evidence:
   ```python
   'themeCompliant': True,
   'themeUtilsImported': True
   ```

3. Update test assertions if gate message format changed

**Verification**: 
```bash
cd services/project-ai
python -m pytest tests/certification/test_certification_gates.py::TestRuntimeGate -v
```
Expected: 4/4 tests pass

#### Task 2.2: Fix Browser Verification Tests (3 failures)

**Files**:
- `services/project-ai/tests/certification/test_certification_gates.py`

**Changes**:
1. Update browser mock to expect UBRC DOM attribute checks:
   ```python
   browser_result = {
       'status': 'PASS',
       'ubrcAttributesFound': ['data-block-id', 'data-block-type'],  # ADD
       'screenshotPath': '...',
       'evidenceIds': [...]
   }
   ```

2. Update evidence ID assertions if format changed (e.g., `browser-ubrc-001` instead of `browser-001`)

**Verification**:
```bash
python -m pytest tests/certification/test_certification_gates.py::TestBrowserGate -v
```
Expected: 3/3 tests pass

#### Task 2.3: Fix Theme Compatibility Tests (9 failures)

**Files**:
- `services/project-ai/tests/certification/test_certification_gates.py`
- Possibly `services/project-ai/app/certification/gates.py` if theme detection logic needs update

**Changes**:

1. **Update "theme-aware block" fixture** (`test_theme_gate_passes_with_theme_aware_block`):
   ```python
   # Old (fails now):
   theme_aware_code = """
   <div style={{ color: theme.primary }}>
   """
   
   # New (correct pattern):
   theme_aware_code = """
   import { getThemeColor } from '../theme-utils';
   const bgColor = getThemeColor(theme, 'slate', 900);
   <div style={{ backgroundColor: bgColor }}>
   """
   ```

2. **Update "hardcoded values" detection** (`test_theme_gate_fails_with_hardcoded_values`):
   - Theme gate should PASS if it finds `getThemeColor()` usage
   - Theme gate should FAIL if it finds raw hex like `#3b82f6` without `getThemeColor()`
   - Update assertion: `assert result.status == FAIL` only for actual hardcoded hex

3. **Update theme detection logic** (`test_theme_gate_detects_design_tokens`):
   - Recognize `theme-utils.ts` import as design token usage
   - Recognize semantic color scales: `theme.slate[900]`, `theme.blue[500]`, etc.

4. **Update multi-block verification** (`test_theme_gate_verifies_multiple_blocks`):
   - Use new theme-aware fixtures for all blocks

**Verification**:
```bash
python -m pytest tests/certification/test_certification_gates.py::TestThemeGate -v
```
Expected: 9/9 tests pass

---

### Phase 3: Fix Placement Executor Tests (3 failures)

**Files**:
- `services/project-ai/tests/.../test_placement.py` (exact path TBD from diagnosis)

**Investigation First**:
1. Read failing test to understand what changed
2. Check if `PlacementManifest` schema added required fields
3. Check if approval enforcement added new validation rules

**Likely Changes**:
1. Update test manifest fixtures to include complete evidence:
   ```python
   manifest = PlacementManifest(
       manifestId="test-001",
       candidateId="i7",
       # ... existing fields ...
       evidenceIds=["ubrc-ev-001", "theme-ev-001", "runtime-ev-001"],  # Complete set
       # Add if new fields exist:
       ubrcCompliant=True,
       themeCompliant=True
   )
   ```

2. Update hash computation if manifest schema changed

**Verification**:
```bash
python -m pytest tests/ -k "placement" -v
```
Expected: 3/3 placement tests pass

---

### Phase 4: Fix Remaining Regressions (62 failures)

**Approach**: Iterative fix based on Phase 1 classification.

**Common Fix Patterns**:

#### Pattern A: DOM Structure Assertion
```python
# Old assertion (fails):
assert '<div id="intro-1">' in rendered_html

# New assertion (correct):
assert 'data-block-id="intro-1"' in rendered_html
assert 'data-block-type="introduction"' in rendered_html
assert 'data-block-version="I7"' in rendered_html
```

#### Pattern B: Color Value Assertion
```python
# Old assertion (fails):
assert '#3b82f6' in component_styles

# New assertion (correct):
assert 'getThemeColor(theme, \'blue\', 500)' in component_source
# OR for rendered output:
assert rendered_color in ['#3b82f6', theme.blue[500]]  # Accept both (theme fallback)
```

#### Pattern C: Snapshot Regeneration
```bash
# If snapshots are genuinely outdated (not test bugs):
python -m pytest tests/path/to/snapshot_test.py --snapshot-update
# Then review diff to confirm changes are expected
```

#### Pattern D: Missing Theme Context in Test
```python
# Old test (fails):
result = render_block(introduction_block)

# New test (correct):
from packages.ui.src.tutorial.theme_utils import DEFAULT_THEME
result = render_block(introduction_block, theme=DEFAULT_THEME)
```

**Per-Failure Strategy**:
1. Read test source
2. Identify which pattern applies
3. Apply fix
4. Run single test to verify
5. Move to next failure

**Verification** (incremental):
```bash
# After each fix:
python -m pytest tests/path/to/fixed_test.py::test_name -v

# Final verification:
python -m pytest -v
```
Expected: All tests pass (or return to 58 baseline failures, 0 new regressions)

---

### Phase 5: Integration Verification

**Objective**: Confirm no production regressions, only test assertion updates.

#### Task 5.1: TypeScript Compilation Check
```bash
cd e:\onlinewebsites\quiz-platform
npx tsc --noEmit --project packages/ui/tsconfig.json
```
Expected: Exit code 0 (already confirmed in W6 report)

#### Task 5.2: JavaScript Test Suite (Vitest)
```bash
cd e:\onlinewebsites\quiz-platform
pnpm test
```
Expected: No NEW failures from W6 changes (may have unrelated failures, focus on Tutorial block tests)

#### Task 5.3: Visual Regression Check (if available)
```bash
# If Playwright/Storybook tests exist:
pnpm test:visual
```
Expected: Block visual rendering unchanged (colors may differ if theme applied, but layout/structure same)

#### Task 5.4: Manual Smoke Test (optional)
1. Start dev server: `pnpm dev`
2. Navigate to Tutorial page with Introduction/Definition/Code blocks
3. Verify:
   - Blocks render correctly
   - Colors look reasonable (should use theme)
   - Dark mode works (toggle if available)
   - DOM inspector shows `data-block-id`, `data-block-type`, `data-block-version` attributes

**Verification**: All integration checks pass

---

## Success Criteria

### Must-Have (Blocking)
- [ ] All 81 test regressions resolved (Python test suite passes or returns to 58 baseline)
- [ ] Zero weakened test assertions (no assertions removed without replacement)
- [ ] TypeScript compilation clean (already true)
- [ ] No production code bugs introduced

### Should-Have (Important)
- [ ] All test fixtures use new theme-aware patterns
- [ ] All DOM assertions check for UBRC attributes
- [ ] All color assertions use semantic tokens or theme-aware checks
- [ ] Test documentation updated if testing patterns changed

### Nice-to-Have (Optional)
- [ ] Snapshot tests regenerated and reviewed
- [ ] Visual regression tests added for theme variants
- [ ] Dark mode test coverage added

---

## Test Commands Reference

### Python Tests (services/project-ai)
```bash
# Working directory:
cd e:\onlinewebsites\quiz-platform\services\project-ai

# Run all tests:
python -m pytest -v

# Run specific test file:
python -m pytest tests/certification/test_certification_gates.py -v

# Run specific test class:
python -m pytest tests/certification/test_certification_gates.py::TestThemeGate -v

# Run specific test:
python -m pytest tests/certification/test_certification_gates.py::TestThemeGate::test_theme_gate_passes_with_theme_aware_block -v

# Run with short traceback:
python -m pytest -v --tb=short

# Run with full output capture:
python -m pytest -v -s

# Collect test names only:
python -m pytest --collect-only
```

### JavaScript Tests (packages/ui)
```bash
# Working directory:
cd e:\onlinewebsites\quiz-platform

# Run all tests:
pnpm test

# Run specific package:
pnpm --filter @quiz/ui test

# Run with watch mode:
pnpm test:watch

# Run with UI:
pnpm test:ui
```

---

## Risk Assessment

### Low Risk Changes
- Updating test assertions to match new DOM attributes ✅
- Updating mock fixtures to include UBRC attributes ✅
- Updating theme detection logic to recognize `getThemeColor()` ✅

### Medium Risk Changes
- Regenerating snapshots (must review diffs carefully) ⚠️
- Modifying gate logic if tests reveal design flaws ⚠️
- Updating manifest schema if new fields required ⚠️

### High Risk Changes (Avoid)
- Removing test assertions without replacement ❌
- Commenting out failing tests ❌
- Weakening validation logic to pass tests ❌
- Changing production code without understanding why tests failed ❌

---

## Rollback Plan

If fixes introduce new issues:

1. **Git Safety**: All fixes should be on `m2-project-ai-canonical-wiring` branch
2. **Atomic Commits**: Commit after each phase for easy revert
3. **Rollback Command**: `git revert <commit-sha>` for specific phase
4. **Full Rollback**: `git reset --hard 0b2d07a4` to return to W6 implementation (before W6-R3)

---

## Notes

1. **Zero-Regression Requirement**: The user's requirement is that tests may be updated to reflect new architecture, but assertions may NOT be weakened merely to make tests pass.

2. **ILS Integration**: W6 review confirmed ILS integration is NOT required. UBRC architecture uses a passive pattern where blocks render DOM attributes and `ActiveBlockContext` detects them via IntersectionObserver. No direct ILS API calls needed in blocks.

3. **Baseline Failures**: 58 test failures existed BEFORE W6. These are acceptable. Only the NEW 81 regressions must be fixed.

4. **Test Quality**: When updating tests, ensure NEW assertions provide EQUAL OR BETTER verification than old assertions.
   - OLD: `assert '#3b82f6' in code` (verifies specific color)
   - GOOD: `assert 'getThemeColor(theme, \'blue\', 500)' in code` (verifies theme system usage)
   - BAD: `# assert color present` (removed assertion)

5. **Documentation**: If testing patterns changed significantly (e.g., all block tests now require theme context), document in test module docstring.

---

## Appendix: File Inventory

### Production Files Modified by W6 (DO NOT CHANGE)
- `packages/ui/src/tutorial/blocks/*.tsx` (12 block components)
- `packages/ui/src/tutorial/types.ts` (DomainTheme interface extended)
- `packages/ui/src/tutorial/theme-utils.ts` (NEW MODULE)

### Test Files to Modify
- `services/project-ai/tests/certification/test_certification_gates.py` (16 failures)
- `services/project-ai/tests/.../test_placement.py` (3 failures)
- Other test files (62 failures, TBD from Phase 1 diagnosis)

### Test Fixture Files (may need updates)
- `services/project-ai/tests/certification/conftest.py` (if exists)
- `services/project-ai/tests/fixtures/*.py` (if exists)
- Inline fixtures in test files

### Evidence Files (read-only reference)
- `.agents/tasks/m2-9-w6-review.md`
- `.agents/tasks/m2-9-w6-implementation-report.md`
- `.agents/tasks/m2-9-w6-ubrc-brand-evidence.json`

---

**Plan Author**: W6-R3 Planning Agent  
**Date**: 2025-01-20  
**Branch**: m2-project-ai-canonical-wiring  
**Baseline Commit**: 0b2d07a4 (W6 implementation)
