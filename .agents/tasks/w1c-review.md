# Legacy Creation Authority Deprecation Cleanup

This change marks the legacy `/creation` endpoints as deprecated, reinforces the CreationMode removal from Wave 0, and delivers a migration guide showing clients how to transition from mode-based workflow shortcuts to the canonical 17-state lifecycle.

The legacy `/creation` routes bypassed the canonical workflow by allowing mode-specific shortcuts (`I2_ONLY`, `MIX_AND_MATCH`, `CANDIDATE_ONLY`). Wave 0 disabled these routes (405 responses), removed `CreationMode` from the codebase, and established `CanonicalWorkflowState` as the single workflow authority. Wave 1C completes the deprecation story: all four route decorators carry `deprecated=True`, the migration guide maps legacy endpoints and modes to their canonical equivalents, and test evidence confirms the deprecation is visible in OpenAPI and enforced at runtime.

**Watch for:** The migration guide references a non-existent `design.py` file in requirement 3, but `DesignSource` is actually defined in `app/models/creation.py` where it belongs. The enum itself is correctly defined with three values (REPOSITORY_CANONICAL, EXTERNAL_AI_PROTOTYPE, USER_SPECIFICATION) and no MIX_AND_MATCH. The integration test at `test_certification_negative.py:557` still sends `"mode": "MIX_AND_MATCH"` in a request body, but this is harmless: the route returns 405 before validating the request, so the test never exercises mode logic. *(confirmed)*

**Verdict**: APPROVED

## High-level view

All four `/creation` route decorators carry `deprecated=True`, making the deprecation visible in OpenAPI schemas and client tooling. The routes return 405 with structured error payloads that point to canonical endpoints, building on Wave 0's enforcement.

`CreationMode` was already removed in Wave 0. This wave adds no code touching that enum. References that remain are comments explaining its removal, skip annotations on legacy tests, and error messages explaining why the mode-based approach was retired.

`DesignSource` lives in `app/models/creation.py`, not `design.py`. It defines three input values for indicating content origin without bypassing workflow state. The migration guide requirement assumes a standalone `design.py` file that doesn't exist, but the enum is correctly placed and defined where it's imported from.

The migration guide provides endpoint mappings, state mappings, before/after code examples, and three scenario walkthroughs (I2-only, mix-and-match, candidate-only). It frames `DesignSource` as an input hint, contrasting it with the removed `CreationMode` which controlled workflow state.

Test evidence confirms four active tests passing (all verify 405 responses with canonical endpoint mappings) and five legacy tests skipped (their skip reasons reference the Wave 0 removal). One integration test body still includes `"mode": "MIX_AND_MATCH"`, but the route rejects the request before parsing it, so the stale payload never reaches validation logic.

<details>
<summary>Issues (2)</summary>

1. **Requirement 3 mismatch** — The review task references `design.py` as the location of `DesignSource`, but the enum is defined in `app/models/creation.py`. No action needed if the requirement was written from memory; if a `design.py` file was intended, clarify whether creation.py is acceptable or a refactor is needed.

2. **Stale integration test payload** — `test_certification_negative.py:557` sends `"mode": "MIX_AND_MATCH"` in the request body. The route returns 405 before parsing, so this doesn't exercise removed code, but the test should be updated or marked as legacy to avoid confusion.

</details>

<details>
<summary>Details</summary>

## Route deprecation markers and 405 enforcement

All four `/creation` routes carry `deprecated=True` in their `@router` decorators (POST/GET workflows, POST validate, POST certify), making the deprecation visible in OpenAPI schemas. The routes immediately raise `HTTPException(status_code=405)` with structured error payloads containing `LEGACY_ENDPOINT_DISABLED`, a message pointing to canonical endpoints, a `canonical_workflow` object mapping legacy actions to new endpoints, and a `reason` explaining the architectural violation.

Four active tests verify these 405 responses and check for the presence of `LEGACY_ENDPOINT_DISABLED` and `canonical_workflow` mapping objects.

## CreationMode removal status

`CreationMode` was removed in Wave 0 (commit `9dc47b46`). This wave adds no code that touches the enum. References that remain are comments explaining the removal, skip annotations on legacy tests, error messages explaining why it was retired, and historical docstrings. No active code path attempts to import, instantiate, or branch on `CreationMode` values. Grep shows no `class CreationMode` definition.

**Finding (confirmed):** One integration test at `test_certification_negative.py:557` still sends `"mode": "MIX_AND_MATCH"` in a request body. The route returns 405 before Pydantic parses the request, so the payload never reaches validation logic and doesn't exercise removed code. The test should be updated to remove the stale payload or marked as a legacy test suite to avoid confusion during future refactors.

## DesignSource enum definition and location

**Finding (confirmed):** The review requirement says "DesignSource enum is correctly defined in design.py with ORIGINAL, REUSE, MIX_AND_MATCH". No `design.py` file exists in the codebase. `DesignSource` is defined in `app/models/creation.py:8`:

```python
class DesignSource(str, Enum):
    """
    M2.9: Indicates where block design originates, without bypassing canonical workflow.
    All design sources follow the same CanonicalWorkflowState lifecycle.
    """
    REPOSITORY_CANONICAL = "REPOSITORY_CANONICAL"
    EXTERNAL_AI_PROTOTYPE = "EXTERNAL_AI_PROTOTYPE"
    USER_SPECIFICATION = "USER_SPECIFICATION"
```

The enum has three values, none named ORIGINAL, REUSE, or MIX_AND_MATCH. The requirement appears to be based on outdated context. The actual values are REPOSITORY_CANONICAL (existing blocks), EXTERNAL_AI_PROTOTYPE (AI-generated designs), USER_SPECIFICATION (user-directed composition).

The docstring clarifies that `DesignSource` is an input indicating content origin, not a workflow state. The migration guide reinforces this distinction in its "Design Source vs Creation Mode" section, explaining that `CreationMode` controlled workflow bypass (removed) while `DesignSource` indicates where design comes from (retained as input).

## Migration guide coverage

The migration guide at `.agents/tasks/w1c-creation-migration-guide.md` maps legacy `/creation/workflows` to canonical `POST /tasks/plan`, maps 5-state `WorkflowStatus` to 17-state `CanonicalWorkflowState`, contrasts `CreationMode` (removed for workflow bypass) with `DesignSource` (retained as input hint), and provides a 12-line legacy snippet vs 50-line canonical example showing the full discovery-gates-approvals lifecycle. Three scenario walkthroughs (I2-only, mix-and-match, candidate-only) show how to express the same intent using canonical endpoints.

The guide frames the deprecation as an architectural correction: "all candidates follow the same lifecycle" replaces "different lifecycles per mode". It lists the 6 certification gates that execute uniformly and the two human approval gates (AWAITING_GATE_1, AWAITING_GATE_2). The "Error Handling" section shows the exact JSON structure clients will receive when hitting deprecated endpoints, so they can parse the error and extract canonical endpoint mappings programmatically.

**Issue (likely):** The guide's Scenario 2 (mix-and-match) originally used `"design_source": "MIX_AND_MATCH"`, which isn't a valid `DesignSource` value. Commit `56891aec` fixed this to `USER_SPECIFICATION`. The evidence report confirms this fix.

## Test evidence

The evidence report at `.agents/tasks/w1c-legacy-cleanup-report.json` records `pytest services/project-ai/tests/test_creation.py -v -k 'creation'` with 4 passed, 5 skipped, 0 failed. All four active tests verify 405 responses with `LEGACY_ENDPOINT_DISABLED` and canonical endpoint mappings. The five skipped tests have skip reasons referencing Wave 0 removal. Commit `56891aec` matches the migration guide fix.

The report includes a `review_fix` section documenting the scenario 2 correction from `MIX_AND_MATCH` to `USER_SPECIFICATION`, showing this is the second review iteration and the finding from the first pass was addressed.

</details>

<details>
<summary>File map</summary>

### Modified

- `services/project-ai/app/api/routes/creation.py` — Added `deprecated=True` to all four route decorators, enhanced error payloads with canonical endpoint mappings
- `services/project-ai/app/api/schemas/creation.py` — Added deprecation notices to schema docstrings, clarified `DesignSource` as input not state

### Created

- `.agents/tasks/w1c-creation-migration-guide.md` — Comprehensive migration guide with endpoint mappings, state mappings, before/after examples, and scenario walkthroughs
- `.agents/tasks/w1c-legacy-cleanup-report.json` — Evidence report with test results, files modified, commit SHA, and review iteration notes

Full diff: `git diff main..m2-project-ai-canonical-wiring` (503 files changed, this review covers the W1C-scoped subset)

</details>
