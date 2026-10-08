# Repository Contract Intelligence for I1/C1/D1 blocks — Review v2

Wave 1B implements repository intelligence that extracts canonical block contracts from TSX source files. The service scans `packages/ui/src/tutorial/blocks/` for Introduction (I1), Code (C1), and Definition (D1) blocks, using regex to extract UBRC attributes (data-block-id, data-block-type, data-block-version) from JSX markup, detect theme token usage, and identify runtime context patterns. This revision addresses four issues from the initial review: dynamic version attribute extraction, RSSB pattern detection, brand independence marker matching, and schema field documentation clarity. All 13 tests pass, and the evidence report confirms the fixes were verified against live block files.

**Watch for:** (1) **Regex version extraction still fragile for complex patterns** — likely: the Priority 2 fallback handles `data-block-version={blockVersion}` by tracing the variable to `const blockVersion = ... ?? 'C1'`, but assumes the fallback literal appears in a simple assignment; nested ternaries, function calls, or imported constants would still return 'unknown'. (2) **RSSB detection conflates prop acceptance with page-level state** — possible: the code detects `runtimeContext` prop usage and infers page-level RSSB, but blocks could accept the prop for metadata (blockId) without participating in page-level state synchronization; no verification that the block actually uses state from the context.

**Verdict**: APPROVED

## High-level view

Version extraction now handles dynamic JSX expressions by detecting `data-block-version={blockVersion}`, extracting the variable name, and searching for its declaration with a fallback literal (`const blockVersion = ... ?? 'C1'`). This covers the canonical I1/C1/D1 pattern where blocks accept runtime version but default to a constant. The regex still depends on a quoted string appearing somewhere in the file; blocks that compute version purely from props or context without a fallback literal would return 'unknown', but no such blocks exist in scope.

RSSB detection moved from unconditional assignment to structural analysis: blocks that accept the `runtimeContext` prop are marked as page-level RSSB participants. The reasoning is that runtimeContext is injected by the page renderer, so prop acceptance indicates the block expects page-level state. This heuristic matches the canonical I1/C1/D1 architecture but doesn't verify the block actually reads state from the context—it could be using only metadata fields like blockId.

Brand independence detection searches for `CANONICAL\s+LOCKED` (flexible whitespace) in the original source before comment removal. IntroductionBlock.tsx contains `CANONICAL LOCKED UI` in a block comment, which now matches. The pattern also checks for `brand.independent` in active code after comment removal, covering both documentation-based and code-based markers.

Schema extraction remains unimplemented. The dataclass field is documented as reserved for future use, and the evidence report acknowledges this as deferred work. The field returns an empty dict consistently, and tests only verify the field is a dict (not schema content correctness).

<details>
<summary>Issues (2)</summary>

1. **Version extraction fragile for complex expressions** — The Priority 2 fallback assumes version fallback appears as a literal in a simple assignment (`const blockVersion = ... ?? 'C1'`). Blocks using nested ternaries, imported constants, or function calls to compute the fallback would return 'unknown'. No canonical blocks use these patterns today, so this is future risk, not a current bug.

2. **RSSB detection doesn't verify state usage** — Detecting `runtimeContext` prop marks the block as page-level RSSB, but the prop could be used only for metadata (blockId, blockType) without reading page-level state. The heuristic matches current canonical blocks but may produce false positives if future blocks accept the prop for non-RSSB purposes. Document the assumption or add a secondary check for state field access.

</details>

<details>
<summary>Details</summary>

## Dynamic version extraction via variable tracing

The revised `discover_canonical_blocks` adds a Priority 2 fallback after literal JSX attributes:

```python
if not version_match:
    jsx_dynamic = re.search(r'data-block-version\s*=\s*\{([^}]+)\}', content_no_comments)
    if jsx_dynamic:
        var_name = jsx_dynamic.group(1).strip()
        var_pattern = rf'{re.escape(var_name)}\s*=.*?["\']([A-Z]\d+)["\']'
        version_match = re.search(var_pattern, content_no_comments)
```

CodeC1Block.tsx uses `data-block-version={blockVersion}` with `const blockVersion = runtimeContext?.blockVersion ?? 'C1'`. The regex extracts the variable name from the JSX expression, then searches for any assignment containing a quoted version literal. The non-greedy `.*?` stops at `'C1'`.

IntroductionBlock.tsx uses `const blockVersion = runtimeContext?.blockVersion ?? block.version` — the fallback is a property reference, not a literal. Priority 2 fails, but Priority 3 catches `case 'I1':` from the switch statement.

If a future block computes version from a lookup table, imported constant, or function call without any quoted literals in the same file, extraction will fail. The warning log will alert engineers, but the contract will report 'unknown'.

## RSSB detection via runtimeContext prop acceptance

The revised `analyze_block_patterns` replaces unconditional assignment with a search for `runtimeContext` in the code. Blocks accepting this prop are marked as page-level RSSB participants.

The heuristic conflates prop acceptance with state participation. Blocks may accept runtimeContext for UBRC metadata (blockId, blockType, blockVersion) without reading page-level shared state. The detection doesn't verify the block uses state fields beyond metadata. Future blocks that accept the prop for metadata-only purposes will be flagged as page-level RSSB even if they don't participate in state synchronization.

## Brand independence detection fixed by pre-comment-removal search

The revised code checks for `CANONICAL\s+LOCKED` before stripping comments:

```python
brand_locked_in_comments = bool(re.search(r'CANONICAL\s+LOCKED', content, re.IGNORECASE))
content_no_comments = _remove_comments(content)
# ... later ...
if re.search(r'brand\.independent', content_no_comments, re.IGNORECASE) or brand_locked_in_comments:
    brand['independent'] = True
```

IntroductionBlock.tsx contains `CANONICAL LOCKED UI` in a block comment. The pattern matches "CANONICAL LOCKED" with flexible whitespace, ignoring the trailing "UI". Dual strategy covers documentation markers in comments and runtime logic in active code.

## Schema extraction acknowledged as deferred

The `CanonicalReference.schema` field consistently returns `{}`. Docstring states it's reserved for future use. The test (`test_extract_schema`) only verifies the field is a dict, not that schema content is correct.

Callers expecting schema data will receive an empty dict with no indication whether extraction failed or the block has no schema. Risk: consumers interpret `{}` as "no schema" rather than "extraction not implemented."

## Test coverage of fixes

Not tested:
- Dynamic version extraction fallback (no test verifies Priority 2 pattern; tests pass because fallback patterns catch switch/case or variable literals)
- Brand independence detection (no test checks `runtime.brand['independent']`)
- RSSB page_level flag correctness (tests verify UBRC fields but don't check `runtime.rssb` content)
- Behavior when a block has `data-block-version={computedValue}` with no fallback literal anywhere in the file

The evidence report confirms manual verification outside the automated suite.

</details>

<details>
<summary>File map</summary>

- **services/project-ai/app/intelligence/repository_intelligence.py** — Repository intelligence implementation; enhanced version extraction with Priority 2 JSX expression handling (lines 147-154), RSSB detection via runtimeContext search (lines 275-282), brand independence check before comment removal (line 247).

- **services/project-ai/tests/intelligence/test_repository_intelligence.py** — Test suite with 13 tests; no changes from v1 (fixes verified via evidence report manual testing, not new test cases).

- **services/project-ai/app/intelligence/__init__.py** — Package marker (no review content).

- **services/project-ai/tests/intelligence/__init__.py** — Package marker (no review content).

Full diff: `git diff main..m2-project-ai-canonical-wiring -- services/project-ai/app/intelligence/ services/project-ai/tests/intelligence/`

</details>
