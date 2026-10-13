# Canonical Comparator Wiring (Wave 3B)

Wave 3B adds coordinator dispatch for the canonical_comparison agent and integration tests that verify the real CanonicalComparator is called with correct PASS/FAIL/BLOCKED status semantics.

Two R4 agents now have handlers: intake, placement, governance, documentation, toolchain, dependency, final-gate, and canonical_comparison all dispatch through agentId string matching instead of the legacy AgentType enum. The coordinator creates a placeholder Agent object for these, bypassing the registry lookup that would fail for R4 agents.

**Watch for:** The implementation defines two separate CanonicalComparator classes - one in `app/agents/canonical_comparison.py` (artifact-based comparison) and another in `app/intake/canonical_comparator.py` (file-based structural comparison). The agent handler uses the artifact-based comparator, which matches the requirements, but having two classes with the same name and overlapping purposes creates confusion and maintenance risk (confirmed). Test coverage is strong for the agent handler path; unit tests confirm PASS/FAIL/BLOCKED semantics work correctly (confirmed).

**Verdict**: APPROVED

---

## High-level view

The coordinator now routes canonical_comparison through execute_canonical_comparison handler, which instantiates the artifact-based CanonicalComparator and calls its compare() method with candidate artifacts, required artifacts list, target family/version, and the optional RepositoryBlockContract. The comparator returns BLOCKED when no contract is available, FAIL when family/version mismatches or required artifacts are missing, and PASS when all checks succeed. Unexpected artifacts generate warnings but don't block approval.

R4 agent dispatch was refactored to handle agentId-based routing for eight agents including canonical_comparison. The coordinator detects these agents in execute_agent() and creates a minimal Agent object with placeholder AgentType, allowing the dispatch to reach the agentId match in _execute_agent_capabilities without attempting a registry lookup.

Integration tests verify the dispatch path reaches the real handler and confirm BLOCKED/FAIL status semantics. The unit test suite (12 tests) validates the comparator logic: family/version mismatch returns FAIL, missing required artifacts returns FAIL with missing_requirements populated, unavailable contract returns BLOCKED, and unexpected artifacts are noted but don't prevent PASS.

Two CanonicalComparator classes exist with different comparison models: the agent handler's comparator operates on artifact dicts with keyword matching, while the intake comparator operates on filesystem paths with AST-level checks. The agent handler only uses the artifact-based comparator; the intake comparator is not invoked by W3B changes.

<details>
<summary>Issues (2)</summary>

1. **Two CanonicalComparator classes** — Merge `app/agents/canonical_comparison.CanonicalComparator` and `app/intake/canonical_comparator.CanonicalComparator` into a single class or rename one to clarify intent. The artifact-based comparator should be the primary implementation; the intake comparator appears to be scaffolding from an earlier design.

2. **Keyword matching is brittle** — `_extract_keywords()` uses hardcoded substring rules ("html" → ["html", ".html", "prototype"]). A requirement like "OpenAPI spec" would not match "openapi.yaml". Consider a more flexible matching strategy or require explicit artifact mappings in the contract.

</details>

---

<details>
<summary>Details</summary>

## Artifact keyword matching fragility

The _extract_keywords() method maps requirement strings to file-related keywords using hardcoded substring rules. "HTML/CSS/JS prototype" produces ["html", ".html", "prototype", "css", ".css", "js", ".js"]. "React/TypeScript implementation" produces ["tsx", ".tsx", "ts", ".ts", "react", "component", "implementation"]. Matching is substring-based: "IntroductionBlock.tsx" matches the "tsx" keyword.

Requirements without tech keywords fail. "Design mockups" generates keywords ["design mockups"], which wouldn't match "mockup.fig". "API specification" wouldn't match "openapi.yaml". The fallback uses the lowercased requirement string itself, so "mockup.fig" would need to contain "design mockups" as a substring to match.

## Two comparators: naming collision

Two CanonicalComparator classes exist:

1. **app/agents/canonical_comparison.CanonicalComparator**: artifact-based comparison. Takes artifact dicts (name, sha256), required artifacts list, target family/version, and RepositoryBlockContract. Returns ComparisonResult with PASS/FAIL/BLOCKED status.

2. **app/intake/canonical_comparator.CanonicalComparator**: file-based structural comparison. Takes candidate_path (filesystem path) and canonical_ref dict (family, version, evidence, required_exports, markers). Returns ComparisonReport with has_breaking_changes, structural_diffs, api_changes, deviations.

The agent handler uses the artifact-based comparator. The intake comparator is not invoked by W3B. The compare() signatures are incompatible, so no risk of accidental substitution, but the naming collision makes the codebase harder to navigate.

## Test coverage gaps

**Not tested:**

- Edge cases in keyword extraction: non-tech requirement strings, international characters, requirements with no recognized keywords
- Fallback behavior when candidate artifacts have no 'name' key (falls back to 'filename', but untested)
- The unused intake comparator's compare() method

</details>

---

<details>
<summary>File map</summary>

**Changed in W3B:**

- `services/project-ai/app/orchestration/agent_coordinator.py`: Added R4 agent detection and placeholder Agent creation in execute_agent(). Added canonical_comparison dispatch clause in _execute_agent_capabilities().
- `services/project-ai/tests/test_agent_coordinator.py`: Added 3 integration tests verifying canonical_comparison dispatch and BLOCKED/FAIL status semantics.

**Pre-existing files (not modified by W3B):**

- `services/project-ai/app/agents/canonical_comparison.py`: Handler and artifact-based CanonicalComparator (implemented before W3B).
- `services/project-ai/app/intake/canonical_comparator.py`: File-based CanonicalComparator (implemented before W3B, not invoked by W3B).
- `services/project-ai/tests/unit/test_canonical_comparison.py`: 12 unit tests for artifact-based comparator (implemented before W3B).

**Full diff:** `git diff 8707e1f4~1..8936241f`

</details>
