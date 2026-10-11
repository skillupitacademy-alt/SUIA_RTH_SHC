# Integration test for verification runner V0-V10 pipeline

This review examines the test coverage fixes for REPAIR-001 (missing integration test for the verification runner) and REPAIR-004 (missing Run-ID in commit footer). The changes add a complete integration test suite (358 lines) validating the V0-V10 verification pipeline and a unit test for commit message formatting.

**Watch for:** None. The integration test comprehensively covers the originally missing scenarios: complete pipeline execution, stage blocking on failure, database validation failures, exit code capture, and evidence collection (confirmed). The test mocks at appropriate boundaries and validates the behavioral contract without requiring live infrastructure.

**Verdict**: APPROVED

## High-level view

The new `test_verification_runner_integration.py` validates the complete V0-V10 pipeline through five test cases: happy path execution with all stages passing, cascade blocking when a mid-pipeline stage fails, pre-flight database validation failures, exit code capture across varying exit codes, and evidence collection. Mocks target the pipeline executor and database validator, testing the runner's orchestration logic without requiring disposable Postgres infrastructure. The final_gate_agent test adds Run-ID footer validation, ensuring commit messages include audit trail metadata.

<details>
<summary>Issues (0)</summary>

No blocking issues found.

</details>

<details>
<summary>Details</summary>

## V0-V10 pipeline execution coverage

The integration test suite validates five critical scenarios. The happy path test (`test_verification_runner_complete_pipeline_execution`) verifies that all 11 stages (V0 through V10) execute, each stage captures its exit code, evidence logs to `agent-runs.jsonl`, and the summary counts match expectations. Mocks replace `run_verification_pipeline` and `validate_and_connect` to isolate the runner's orchestration logic from the actual database and subprocess execution.

The cascade blocking test (`test_verification_runner_stages_blocked_on_failure`) verifies stop-on-failure semantics: when V2 fails with exit code 1, stages V3-V10 are marked `BLOCKED` with `exit_code=None` and include a `blocked_reason`.

The database validation test (`test_verification_runner_database_validation_failure`) confirms the runner fails fast when `validate_and_connect` raises `ValueError` (unsafe database target). The agent returns `FAILED` status, populates the `errors` list, and executes zero stages.

Exit code capture (`test_verification_runner_captures_exit_codes`) verifies that both successful (exit code 0) and failed stages (exit code 127) have their exit codes recorded in the output. Evidence collection (`test_verification_runner_evidence_collection`) confirms `agent-runs.jsonl` appears in `evidence_ids` and execution metadata is populated.

All five tests mock at the correct boundary: the pipeline executor and database validator are replaced, but the runner's orchestration, result transformation, and error handling remain under test.

## Run-ID commit footer validation

The `test_format_commit_message_includes_run_id` test validates that `format_commit_message` includes a `Run-ID: <run_id>` footer in both default and custom summary modes.

</details>

<details>
<summary>File map</summary>

- `services/project-ai/tests/workflows/migration_repair/test_verification_runner_integration.py` — NEW 358-line integration test suite for V0-V10 pipeline
- `services/project-ai/tests/test_migration_repair_agent_final_gate_agent.py` — +16 lines adding Run-ID footer test
- `services/project-ai/tests/workflows/migration_repair/test_sql_parsing_real.py` — Clarifying comment about parse_sql_statements location (informational, not behavior change)

Full diff: `git diff a64e5b13..61d8b253 -- services/project-ai/tests/`

</details>
