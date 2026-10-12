# Implementation Plan: Stage 5 High-Severity Fixes

## Overview
This plan addresses 3 HIGH severity issues identified in the Stage 5 triple-review of the migration repair workflow. All fixes target the `services/project-ai` service and maintain existing test coverage (36/40 tests passing).

## Context
- **Project Type**: Python FastAPI service (project-ai)
- **Test Framework**: pytest 9.1.1 with pytest-asyncio
- **Build Command**: `python -m pytest tests/`
- **Test Coverage Command**: `python -m pytest tests/ --cov=app --cov-report=term`
- **Key Patterns**: 
  - Async/await for subprocess execution
  - CommandResult dataclass for command outputs
  - Evidence logging to .agents/evidence/
  - Unit tests use mocks; integration tests use real subprocess calls

---

# Implementation Plan

- [ ] 1. **Fix 1: Add exit code validation to verify_commit_identity() git subprocess calls**
      
      The `verify_commit_identity()` function in `final_gate_agent.py` calls `run_command("git rev-parse HEAD")` but only checks for exceptions, not the exit code in the returned CommandResult. This is a security risk — a non-zero exit code could indicate git command failure or tampering.
      
      **Change**: After calling `run_command()`, check `result.exit_code`. If non-zero, treat it as a verification failure and return `(False, None, None)` with appropriate logging.
      
      **Files**: 
      - `e:\onlinewebsites\quiz-platform\services\project-ai\app\workflows\migration_repair\agents\final_gate_agent.py`
      
      **Verification**: Run existing unit tests for final_gate_agent:
      ```
      python -m pytest tests/test_migration_repair_agent_final_gate_agent.py -v
      python -m pytest tests/test_final_gate_verification.py::test_verify_commit_identity_handles_git_failure -v
      ```
      All existing tests must pass. The test `test_verify_commit_identity_handles_git_failure` should continue to pass, confirming exception handling works. The new exit code check adds a second layer of safety.

- [ ] 2. **Fix 2: Add format_commit_message() function with Run-ID footer**
      
      Commit messages currently lack a Run-ID footer for traceability. Create a new function `format_commit_message()` in `final_gate_agent.py` that takes a run_id parameter and returns a formatted commit message with the footer `Run-ID: {run_id}`.
      
      **Implementation**:
      - Add `format_commit_message(run_id: str, summary: str = "Migration repair verification complete") -> str` function
      - Function returns a multi-line string: summary + blank line + `Run-ID: {run_id}`
      - Follow the pattern used in evidence logging where run_id format is `migration-repair-YYYYMMDD-HHMMSS-{uuid8}`
      - Extract run_id from `context.workflow_state.get('run_id')` or generate one in `execute_final_gate_agent()`
      
      **Files**: 
      - `e:\onlinewebsites\quiz-platform\services\project-ai\app\workflows\migration_repair\agents\final_gate_agent.py`
      
      **Verification**: Create new unit test in the same file pattern:
      ```python
      def test_format_commit_message_includes_run_id():
          message = format_commit_message("migration-repair-20261011-143539-06936246")
          assert "Run-ID: migration-repair-20261011-143539-06936246" in message
          assert len(message.split("\n")) >= 2  # At least summary + footer
      ```
      Run: `python -m pytest tests/test_migration_repair_agent_final_gate_agent.py::test_format_commit_message_includes_run_id -v`

- [ ] 3. **Fix 3: Create integration test for verification_runner W6 V0-V10 pipeline**
      
      No integration test exists for the `verification_runner` agent executing the complete V0-V10 validator pipeline with disposable database and evidence collection. This test is critical for end-to-end validation of the migration repair workflow.
      
      **Implementation**:
      - Create `e:\onlinewebsites\quiz-platform\services\project-ai\tests\workflows\migration_repair\test_verification_runner_integration.py`
      - Use the pattern from `tests/test_integration.py` for FastAPI test structure
      - Follow the mocking pattern from `tests/test_verification_cleanup.py` for subprocess mocking
      - Test must include:
        1. **Setup/Teardown**: Mock docker-compose calls (V0, V10) — no real database
        2. **Pipeline Execution**: Call `execute_verification_runner(context)` with mocked `run_command`
        3. **Stage Results**: Assert all V0-V10 stages present in result.outputs["stages"]
        4. **Exit Codes**: Verify each stage has `exit_code` field captured
        5. **Evidence**: Verify `result.evidence_ids` includes "agent-runs.jsonl"
        6. **Blocked Handling**: Test that when V2 fails (exit_code=1), V3-V10 are marked BLOCKED
      - Mock `validate_and_connect()` to return a mock connection (no real DB operations)
      
      **Files**: 
      - `e:\onlinewebsites\quiz-platform\services\project-ai\tests\workflows\migration_repair\test_verification_runner_integration.py` (create new file)
      - Create directory structure: `tests\workflows\migration_repair\` if it doesn't exist
      
      **Verification**: Run the new integration test:
      ```
      python -m pytest tests/workflows/migration_repair/test_verification_runner_integration.py -v
      ```
      All test cases must pass. Run full test suite to ensure no regressions:
      ```
      python -m pytest tests/test_migration_repair_agent_verification_runner.py -v
      ```
      Existing 3 tests in `test_migration_repair_agent_verification_runner.py` must continue passing.

---

## Success Criteria

1. **Fix 1**: `verify_commit_identity()` checks both exceptions AND exit codes from git subprocess calls
2. **Fix 2**: `format_commit_message()` function exists and includes Run-ID footer in expected format
3. **Fix 3**: Integration test `test_verification_runner_integration.py` exists and passes, covering V0-V10 pipeline execution
4. **No Regressions**: All 36/40 existing passing tests continue to pass
5. **Evidence**: Each fix is independently verifiable via its specified test commands

## Notes

- **Security Context**: Fix 1 addresses a potential security gap where git command failures could go undetected
- **Traceability**: Fix 2 enables correlation between commits and workflow runs in audit trails
- **Coverage Gap**: Fix 3 fills a critical integration test gap for the W6 verification pipeline
- **Scope Constraint**: No refactoring of unrelated code; only the 3 specified issues are addressed
