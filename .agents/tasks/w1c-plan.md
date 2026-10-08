# Implementation Plan: Wave 1C - Legacy Creation Authority Cleanup

## Context

**Branch:** m2-project-ai-canonical-wiring (base 5acbd7b3, W0 complete)  
**Task:** M2.9 Wave 1C — Legacy Creation Authority Cleanup

W0 established the canonical workflow authority:
- `CanonicalWorkflowState` (17 states) is the single source of truth
- `/workflows` endpoints in `app/api/routes/workflows.py` implement canonical lifecycle
- `WorkflowTarget` binding prevents version mismatches (I7 vs 1.0.0)
- Legacy `/creation` routes already return 405 with deprecation notices

W1C completes the cleanup by:
1. Adding explicit deprecation markers to all legacy routes
2. Reclassifying `CreationMode.MIX_AND_MATCH` from workflow state to design input
3. Creating migration guide for developers
4. Ensuring deprecation warnings are testable

## Design Decisions

### Decision 1: Deprecation Strategy (Mark, Don't Remove)
The legacy `/creation` routes are already disabled (405 responses) but the code remains for backward compatibility testing. We will add explicit `deprecated=True` markers to the router and enhance error messages to point developers to canonical endpoints.

**Rationale:** Complete removal would break any existing client code that relies on error messages. Marking as deprecated with clear migration paths is the safer approach.

### Decision 2: DesignSource as Input, Not State
`DesignSource` enum already exists in `app/models/creation.py` with three values:
- `REPOSITORY_CANONICAL`: Design from existing canonical blocks
- `EXTERNAL_AI_PROTOTYPE`: Design from External AI
- `USER_SPECIFICATION`: User-specified design

The old `CreationMode.MIX_AND_MATCH` will be removed, and `DesignSource` will be documented as a design input (not workflow state) that indicates content origin without bypassing the canonical workflow.

**Rationale:** The distinction between "how content is created" (design source) and "how workflow proceeds" (canonical state) prevents workflow bypass shortcuts while preserving flexibility in content sourcing.

### Decision 3: Migration Guide Location
Migration guide will be created at `e:\onlinewebsites\quiz-platform\.agents\tasks\w1c-creation-migration-guide.md` following the pattern of existing task documentation in `.agents/tasks/`.

**Rationale:** This location keeps migration documentation with other architectural decisions and Wave implementation artifacts, making it discoverable for future maintainers.

## Implementation Plan

- [ ] 1. Add explicit deprecation markers to creation routes.
      Update router decorator in `services/project-ai/app/api/routes/creation.py` to include `deprecated=True`.
      Enhance existing 405 error responses to include canonical endpoint examples with specific transition mappings.
      Files: `services/project-ai/app/api/routes/creation.py`
      Verify: `pytest services/project-ai/tests/test_creation.py -v` — all tests pass, verify deprecation notices in error responses.

- [ ] 2. Remove CreationMode enum and update DesignSource documentation.
      Search for any remaining references to `CreationMode.MIX_AND_MATCH` in codebase and remove them.
      Add comprehensive docstring to `DesignSource` enum in `services/project-ai/app/models/creation.py` explaining it is an input (not workflow state).
      Update `CreateWorkflowRequest` in `services/project-ai/app/api/schemas/creation.py` to document `design_source` as deprecated input.
      Files: `services/project-ai/app/models/creation.py`, `services/project-ai/app/api/schemas/creation.py`
      Verify: `pytest services/project-ai/tests/ -v` — all tests pass, no references to CreationMode remain.

- [ ] 3. Create comprehensive migration guide.
      Document the following mappings:
      - Legacy `/creation/workflows` → Canonical workflow initiation sequence
      - CreationMode patterns → DesignSource usage
      - State mapping: WorkflowStatus → CanonicalWorkflowState
      - Code examples showing before/after API usage
      - Deprecation timeline and compatibility policy
      Files: `.agents/tasks/w1c-creation-migration-guide.md`
      Verify: Manual review — guide is clear, complete, and contains working examples.

- [ ] 4. Verify deprecation warnings in tests.
      Run creation-specific tests to ensure deprecation warnings appear correctly.
      Verify that error responses contain canonical endpoint mappings.
      Confirm that existing 405 tests validate the error message structure.
      Files: No changes (verification only)
      Verify: `pytest services/project-ai/tests/test_creation.py -v` — all 4 active tests pass, each validates error structure.

- [ ] 5. Run full test suite and verify no regressions.
      Execute complete project-ai test suite to ensure cleanup didn't break canonical workflow.
      Verify that workflow routes still function correctly.
      Check that DesignSource changes don't impact canonical workflow state machine.
      Files: No changes (verification only)
      Verify: `pytest services/project-ai/tests/ -v` — all tests pass with no new failures.

- [ ] 6. Commit and push changes with conventional commit message.
      Stage all modified files.
      Create commit with message: `feat(project-llm): deprecate legacy creation authority (M2.9 W1C)`
      Include detailed commit body explaining cleanup scope.
      Push to `origin/m2-project-ai-canonical-wiring`.
      Files: All modified files from steps 1-3
      Verify: `git log --oneline -1` shows correct commit message, `git status` shows clean working tree.

## Verification Commands

Build command: None required (Python with no build step)
Test command: `pytest services/project-ai/tests/ -v`
Specific test: `pytest services/project-ai/tests/test_creation.py -v -k 'creation'`

## Files to Modify

1. `services/project-ai/app/api/routes/creation.py` — Add deprecation marker, enhance error messages
2. `services/project-ai/app/models/creation.py` — Remove CreationMode references, document DesignSource
3. `services/project-ai/app/api/schemas/creation.py` — Update docstrings for deprecated schemas
4. `.agents/tasks/w1c-creation-migration-guide.md` — Create migration guide (new file)

## Files to Reference (No Changes)

- `services/project-ai/app/orchestration/canonical_workflow.py` — Canonical state machine (authority)
- `services/project-ai/app/api/routes/workflows.py` — Canonical workflow endpoints
- `services/project-ai/app/models/workflow_target.py` — Target binding model
- `services/project-ai/tests/test_creation.py` — Existing deprecation tests

## Environment Constraints

- Python 3.11+ with pytest test framework
- FastAPI application with in-memory storage (no database required)
- Git workflow: all changes on `m2-project-ai-canonical-wiring` branch
- No server restart required (changes are to disabled endpoints)

## Key Patterns

- Error response structure: `{"detail": {"error": "CODE", "message": "...", "canonical_workflow": {...}}}`
- Deprecation comments: `# M2.9 Wave X: Description` format used throughout codebase
- Test structure: FastAPI TestClient with direct endpoint calls
- Enum docstrings: Multi-line with architectural context and usage rules
