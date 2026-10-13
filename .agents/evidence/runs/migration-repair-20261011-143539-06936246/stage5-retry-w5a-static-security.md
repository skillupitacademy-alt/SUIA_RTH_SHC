# Git exit code validation in verify_commit_identity

This change adds exit code validation to `verify_commit_identity()` in the final gate agent, addressing the HIGH severity finding that git command failures were not being checked. The fix adds a guard after the `git rev-parse HEAD` call that returns `(False, None, None)` when the exit code is non-zero, preventing unvalidated git output from propagating through the verification pipeline. Two supporting changes are also included: a new `format_commit_message()` helper that embeds Run-ID footers for traceability, and a comprehensive integration test suite for the verification runner's V0-V10 pipeline.

**Watch for:** None. The exit code validation is correctly implemented (confirmed). The change is narrowly scoped to the security issue and does not introduce new risks.

**Verdict**: APPROVED

## High-level view

The git exit code validation adds a simple guard: after calling `git rev-parse HEAD`, the code now checks `result.exit_code != 0` and returns early with `(False, None, None)` to signal failure. This prevents the downstream code from attempting to parse stdout when the git command failed.

The `format_commit_message()` function is a straightforward utility that concatenates a summary line with a Run-ID footer using string formatting. It has no security implications.

The new integration test file adds 358 lines covering the verification runner's disposable database lifecycle (V0 setup, V1-V9 validation stages, V10 teardown), exit code capture, and evidence collection. The tests mock the pipeline execution and database connections, so they don't validate the exit code fix directly.

<details>
<summary>Issues (0)</summary>

No blocking issues found.

</details>

<details>
<summary>Details</summary>

## Exit code guard placement and failure mode

The added validation appears at lines 169-171 in `verify_commit_identity()`:

```python
# Validate git command succeeded
if result.exit_code != 0:
    # Non-zero exit code indicates failure
    return False, None, None
```

This is positioned immediately after `run_command("git rev-parse HEAD", timeout=10)` and before `current_sha = result.stdout.strip()`. The return value `(False, None, None)` matches the function's documented signature `tuple[bool, Optional[str], Optional[str]]` and signals match failure with no SHA values.

The failure mode is fail-safe: when git fails, the gate blocks rather than proceeding with unvalidated state. The error is surfaced in the `verification_errors` list with the message "Commit SHA mismatch: current=None, tested=None" (line 349).

The command string `"git rev-parse HEAD"` is a literal with no interpolated user input, so there is no shell injection risk at this call site.

## Test coverage gap

No test case directly verifies `verify_commit_identity()`'s new exit code handling. The existing test `test_final_gate_agent_returns_verdict()` calls `execute_final_gate_agent()`, which in turn calls `verify_commit_identity()`, but it does not mock a git failure scenario. Adding a test case that mocks `run_command()` to return a non-zero exit code would improve coverage of the security fix, but the absence of such a test does not block approval since the fix itself is straightforward and correct.

</details>

<details>
<summary>File map</summary>

- `services/project-ai/app/workflows/migration_repair/agents/final_gate_agent.py` — Added exit code validation in `verify_commit_identity()` and `format_commit_message()` helper
- `services/project-ai/tests/test_migration_repair_agent_final_gate_agent.py` — Added test for `format_commit_message()` Run-ID footer
- `services/project-ai/tests/workflows/migration_repair/test_verification_runner_integration.py` — New integration tests for verification runner V0-V10 pipeline (358 lines)

[Full diff](command:git.openDiff?61d8b253)

</details>
