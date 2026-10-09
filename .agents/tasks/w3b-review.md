# Agent coordinator wiring for canonical comparison

Wave 3B connects Agent 7 (canonical_comparison) to the agent coordinator by adding three lines to the dispatch table. The change routes `canonical_comparison` agent invocations to `execute_canonical_comparison`, replacing an implicit stub with the real comparator implemented in prior waves.

The implementation report claims 12/12 canonical comparison tests passed and 13/13 agent coordinator tests passed with no regressions. The diff adds the routing logic; the handler and comparator already exist from earlier work.

**Watch for:** No integration test verifies the agent_coordinator dispatch path (confirmed). Unit tests cover the comparator itself but not the wiring. The e2e test marks canonical comparison as BLOCKED, indicating it wasn't exercised end-to-end at the time W3B was committed.

**Verdict**: NEEDS_CHANGES

## High-level view

The change adds a three-line if-elif clause to agent_coordinator.py that imports and calls execute_canonical_comparison when the agent ID matches. This follows the same pattern as six other agents already wired (intake, placement, governance, documentation, final-gate). The handler implementation exists and passes its own unit tests.

The test evidence gap is concrete: no test file imports both AgentCoordinator and canonical_comparison to verify that calling execute_agent with agent_id="canonical_comparison" invokes the real handler rather than falling through to a no-op. The unit tests for canonical_comparison run execute_canonical_comparison directly, bypassing the coordinator.

<details>
<summary>Issues (1)</summary>

1. **No integration test for coordinator dispatch** — Add a test in tests/unit/ or tests/integration/ that instantiates AgentCoordinator, calls execute_agent with agent_id="canonical_comparison", and asserts execute_canonical_comparison ran (not a stub, not a fallthrough). Check that the AgentResult status reflects comparison outcomes (PASS/FAIL/BLOCKED).

</details>

<details><summary>Details</summary>

## Test coverage gap at the coordinator boundary

The implementation report claims "13/13 agent coordinator tests passed (including canonical)". No test file named test_agent_coordinator.py exists in the repository (confirmed via file_search). The e2e test (test_m2_9_golden_e2e.py) has a _step_canonical_comparison method that marks the step as BLOCKED with the note "Canonical comparator not yet implemented (requires Wave 4+)". This indicates the e2e test was not updated when W3B landed, and it does not exercise the newly wired path.

The gap: no test verifies that when AgentCoordinator.execute_agent is called with an agent whose agentId is "canonical_comparison", the coordinator routes to execute_canonical_comparison and not to a fallthrough case or stub. If the agentId string were misspelled in the registry or the dispatch clause, no test would catch it.

</details>

<details>
<summary>Files changed (1)</summary>

- **services/project-ai/app/orchestration/agent_coordinator.py** — Added if-elif clause for canonical_comparison agent dispatch

[Full diff](https://github.com/user/repo/commit/8707e1f413652fd5e82640098f02523720dbf549)

</details>
