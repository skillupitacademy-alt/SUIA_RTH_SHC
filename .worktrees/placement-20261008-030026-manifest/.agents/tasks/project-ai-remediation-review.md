# Project AI Remediation Implementation Review

**Branch:** m2-project-ai-foundation  
**Base:** main  
**Commit:** 2aca5db5  
**Review Date:** 2025-01-30  

## Summary

This remediation implements the Project AI foundation across 9 waves, establishing evidence logging infrastructure, agent handlers, certification gates with PlacementManifest enforcement, and runtime verification capabilities. The implementation creates 6 agent handlers from scratch, adds an EvidenceRecord model and logging system, enforces PlacementManifest validation in all gates, and completes runtime verification with health checks. The architecture correctly maintains the boundary between TypeScript discovery and Python orchestration.

**Watch for:**
- **confirmed** — Python imports playwright.async_api in browser.py (line 101), violating the architectural rule that Python must orchestrate Node/Playwright via subprocess, not install playwright-python
- **confirmed** — API route creation.py infers file paths from block names (lines 217-220), violating the PlacementManifest requirement that paths must come from human-approved manifests
- **confirmed** — 22 test failures related to brand/theme verification gates and agent coordinator
- **likely** — Snapshot generation not integrated into pnpm scripts (package.json missing "scan" command), requiring manual script execution

**Verdict**: CHANGES_REQUESTED

## High-level view

The evidence logging infrastructure creates a structured .project-ai/runs/ directory hierarchy with proper metadata, gate results, and agent results, correctly using 2-space JSON indentation and Windows symlink fallbacks. Six agent handlers (toolchain, dependency, intake, placement, governance, documentation) are properly implemented with AgentContext/AgentResult contracts and dispatched through AgentCoordinator. All certification gates accept PlacementManifest parameters and validate manifest hashes, evidence IDs, and path inference prohibition. The documentation agent correctly appends to m1-m2-backlog.md rather than overwriting it. Runtime verification adds health check endpoints with three-level fallback and graceful shutdown with timeout enforcement, though browser.py violates the subprocess orchestration rule by importing playwright directly. The Playwright configuration correctly enforces workers: 1 for sequential execution. Test coverage is strong (330 tests, 302 passing) but 22 failures in brand/theme gates indicate incomplete verification logic.

<details>
<summary>Issues (8)</summary>

1. **Python Playwright import violates architecture** — browser.py imports `from playwright.async_api import async_playwright` (line 101), directly contradicting the architectural rule that Python must spawn Node/Playwright via subprocess. Remove this import and implement BrowserCertificationRunner with subprocess orchestration as designed.

2. **Path inference from block names in creation.py** — Lines 217-220 construct candidate file paths by inferring from block type (`f"packages/ui/src/tutorial/blocks/{block_type.capitalize()}Block.tsx"`), violating the PlacementManifest requirement. Remove this inference and require paths from manifest only.

3. **22 test failures in brand/theme gates** — Brand independence and theme compatibility gates have assertion failures indicating verification logic doesn't match test expectations. Review gate implementations and test expectations to resolve mismatches.

4. **Snapshot generation not integrated** — TypeScript discovery package.json lacks a "scan" script, requiring developers to manually run `npx ts-node scripts/generate-snapshot.ts`. Add script: `"scan": "tsx scripts/generate-snapshot.ts"` and output directory creation.

5. **AgentCoordinator missing final-gate dispatch** — The execute_agent() dispatcher has cases for toolchain, dependency, intake, placement, governance, documentation but no final-gate case, despite final_gate.py existing. Add the dispatch case.

6. **Browser.py graceful degradation incomplete** — browser.py returns RuntimeVerification when Playwright not installed but doesn't properly integrate with gate execution flow. Ensure gates handle this degradation without blocking certification.

7. **EvidenceRecord to_dict uses camelCase** — Python evidence.py converts snake_case to camelCase for JSON serialization, but this creates inconsistency risk. Verify all consumers expect camelCase keys.

8. **datetime.utcnow deprecation warnings** — AgentContext and AgentResult use datetime.utcnow() (deprecated in Python 3.13), causing 286 test warnings. Replace with datetime.now(UTC) throughout.

</details>

<details>
<summary>Details</summary>

## Evidence logging infrastructure and run directory structure

The EvidenceLogger class in evidence/logger.py creates properly structured run directories at `.project-ai/runs/{commit-sha}-{snapshot-hash}/` with metadata.json, snapshot copy, and subdirectories for gates/, agents/, screenshots/, commands/, logs/, results/, browser/, and final/. The create_run_directory() method validates snapshot existence, extracts evidence count, retrieves git branch via subprocess, and creates all required subdirectories. Metadata includes runId, commitSha, snapshotHash, branch, timestamp, snapshotPath, evidenceCount, and status fields. JSON formatting consistently uses 2-space indentation via `indent=2` in all json.dumps() calls.

The current symlink/fallback mechanism properly handles Windows constraints: attempts symlink creation first, falls back to current.txt file containing the run ID when symlinks fail (no admin privileges). The get_current_run_dir() method checks symlink first, then current.txt fallback. Evidence records created from TypeScript snapshots via EvidenceRecord.from_snapshot() correctly map camelCase JSON keys to snake_case Python fields.

Ten tests in tests/evidence/test_logger.py cover directory creation, metadata generation, snapshot copying, gate/agent result logging, symlink updates, and Windows fallback.

## Agent handler implementation and dispatch mechanism

Six agent handlers created from scratch in app/agents/ (toolchain.py, dependency.py, intake.py, placement.py, governance.py, documentation.py), each implementing the execute_{agent_name}(context: AgentContext) -> AgentResult pattern. Handlers correctly:
- Extract snapshot data from context.repository_snapshot (frozen, never re-read files)
- Collect evidence IDs from snapshot.evidence array (no synthetic IDs)
- Return AgentResult with agent_id, status, outputs, evidence_ids, errors, warnings, execution_time_ms, timestamp
- Use datetime.now(UTC) for timestamps (except AgentContext/AgentResult base classes which still use deprecated datetime.utcnow)

Toolchain agent extracts runtime.toolchains from snapshot and returns toolchain_count, toolchains list, toolchain_map. Dependency agent analyzes dependency graph and detects cycles and version conflicts with warnings. Intake agent classifies candidate block families. Placement agent generates PlacementManifest with hash and enforces REQUIRES_HUMAN_APPROVAL placeholder instead of inferring paths. Governance agent verifies manifest hashes and enforces submitter != approver rule. Documentation agent builds certification summary and appends to canonical backlog.

AgentCoordinator.execute_agent() dispatcher (lines 164-182) maps agent_id strings to handler imports with six elif branches. Missing final-gate case despite final_gate.py existing. Each branch imports the handler function and awaits it with context. Unknown agent_ids return FAILED status with error message.

47 tests across tests/agents/ covering all handlers with success cases, error handling, evidence collection, and agent-specific logic (cycle detection, family classification, self-approval prevention, no path inference).

## PlacementManifest validation in certification gates

All six gate methods in certification/gates.py accept `manifest: Optional[PlacementManifest] = None` parameter and call `_validate_manifest()` first when manifest provided. The _validate_manifest() helper performs three checks:

1. **Manifest hash verification** — Computes SHA-256 hash of manifest JSON (excluding manifestHash field) and compares to provided hash, detecting tampering
2. **Path inference detection** — Checks if candidateId appears within targetPath, rejecting paths inferred from block names
3. **Evidence ID validation** — Verifies all manifest.evidenceIds exist in snapshot.evidence array

Gates return BLOCKED status with specific error messages when manifest validation fails. Five tests in test_gates.py::TestManifestValidation cover valid hash, tampering detection, path inference detection, missing evidence IDs, and gate execution with invalid manifest. Six integration tests confirm each gate accepts manifest parameter.

However, creation.py route handler (lines 217-220) infers candidate file paths from block types without using PlacementManifest, violating this architectural rule.

## Canonical documentation append behavior

Documentation agent's _append_to_canonical_backlog() function (documentation.py lines 109-162) reads existing m1-m2-backlog.md content, constructs append section with timestamp/commit/agent results, and writes `existing_content + append_section`. Never replaces or recreates the file. Git diff confirms m1-m2-backlog.md shows additions only (no deletions), with multiple certification run sections appended. The file grew from 18 lines to 631 lines, all additions after line 18.

The append section format includes separator (---), heading with timestamp, commit SHA, agent counts, and agent result list with status and execution time. Final gate agent (final_gate.py lines 95-115) follows same pattern, reading existing backlog and appending final gate results without replacement.

## Runtime verification with health checks and process management

Runtime verification in verification/runtime.py adds APP_PORTS mapping (skillhubcore-admin: 3000, realtutorialhub-admin: 3001, suia-admin: 3009) and get_health_url() function. ApplicationProcess.verify_health() implements three-level fallback:
1. Try /api/health endpoint
2. Fallback to /health
3. Fallback to / (root)

Each level uses requests.get() with configurable timeout, returns True if status 200, catches RequestException and continues to next fallback level. ApplicationProcess.start() launches process via subprocess.Popen with pnpm --filter {target} dev command, polls health endpoint in loop until timeout (default 30s), calls stop() if health check fails.

ApplicationProcess.stop() implements graceful shutdown: calls process.terminate() (SIGTERM), waits with timeout, escalates to process.kill() (SIGKILL) if timeout expires.

Six tests in tests/verification/test_runtime.py cover health check success, failure, fallback, startup timeout, clean shutdown, and force kill.

## Playwright subprocess orchestration violation

The browser.py file imports `from playwright.async_api import async_playwright` at line 101 inside a try/except ImportError block. This violates the architectural rule stated in the design document: "Python MUST orchestrate Node/Playwright via subprocess. Do NOT install `playwright-python`." The design explicitly requires BrowserCertificationRunner to spawn Node processes executing Playwright tests, not import playwright directly into Python.

The import appears intentional (wrapped in try/except for graceful degradation when playwright not installed), but the architecture explicitly forbids this pattern. The correct implementation requires:
1. Remove playwright.async_api import
2. Generate Playwright test specs dynamically (TypeScript files)
3. Execute via subprocess: `pnpm exec playwright test {spec} --project=chromium`
4. Parse JSON results from Playwright output
5. Collect screenshots and console errors

Current browser.py also uses async_playwright() context manager and calls playwright methods directly (browser.launch, page.goto, page.wait_for_selector). This entire implementation needs replacement with subprocess orchestration per the design.

The design document notes (section 3.7): "The current `services/project-ai/app/verification/browser.py` imports `from playwright.async_api import async_playwright`. This violates the architectural boundary and must be replaced with subprocess orchestration in Wave R7." Wave R7 appears complete in commits, but this violation remains.

Playwright is NOT in pyproject.toml dependencies (confirmed), so the import fails at runtime and triggers graceful degradation to RuntimeVerification with error_code RUNTIME_START_FAILURE. This prevents the violation from causing runtime errors but doesn't fix the architectural boundary breach.

## Playwright configuration enforces sequential execution

The playwright.project-ai.config.ts file correctly sets `workers: 1` at line 22 with explicit comment: "Sequential execution only - NEVER parallel." The config also sets fullyParallel: false.

Three E2E test specs exist in tests/e2e/project-ai/: i2-composition.spec.ts, mix-match-composition.spec.ts, and preflight.spec.ts, totaling 305 lines.

## Snapshot generation and TypeScript discovery

The TypeScript discovery package at packages/project-llm-discovery has a generate-snapshot.ts script but package.json lacks a "scan" command (only type-check, test, test:watch, test:coverage). Attempting `pnpm --filter @quiz/project-llm-discovery scan` fails with "Missing script: scan". The script exists at scripts/generate-snapshot.ts and can run via `npx ts-node scripts/generate-snapshot.ts` but isn't integrated into pnpm workflow.

No snapshot.json file exists in packages/project-llm-discovery/output/ (directory doesn't exist). This blocks Python integration tests that depend on snapshot availability. Several tests are skipped due to missing snapshot (tests/integration/test_i2_e2e_certification.py).

The design document (section 2.1) describes snapshot infrastructure as "✅ COMPLETE (220/220 tests passing)" with evidence output of 842 records, but no generated snapshot file found in repository. Either snapshot needs generation or output directory needs creation in version control.

## Agent dispatch completeness

AgentCoordinator.execute_agent() implements dispatch for six agents (toolchain, dependency, intake, placement, governance, documentation) via if/elif chain at lines 164-182. The else branch returns FAILED status for unknown agents. However, final_gate.py exists in app/agents/ with execute_final_gate() function, but no dispatch case exists for "final-gate" agent_id.

Final gate agent implements verdict calculation, gate result aggregation, evidence binding verification, and canonical backlog append. Twelve tests in tests/agents/test_final_gate.py cover all functionality and pass. The agent exists and works but isn't wired into the dispatcher.

Missing dispatch case means calling execute_agent("final-gate", context) returns FAILED with "Unknown agent: final-gate" error instead of executing the handler.

## Test suite results and failures

Test execution shows 330 tests collected, 302 passed, 22 failed, 6 skipped, 286 warnings. Failures concentrated in:
- tests/test_certification_gates.py (13 failures in brand/theme gates)
- tests/test_agent_coordinator.py (6 failures in agent execution)
- tests/integration/test_certification_negative.py (1 failure in brand coupling)
- tests/test_integration.py (1 failure in i2 happy path)

Brand independence gate failures show assertions like `assert <CertificationGateStatus.FAIL> == <CertificationGateStatus.PASS>`, indicating gates return FAIL when tests expect PASS. Theme compatibility gate failures follow same pattern. This suggests verification logic doesn't match test expectations or test data doesn't satisfy gate requirements.

Agent coordinator failures include missing 'certification_passed' key in outputs (line 373 error), suggesting incomplete output structure in certification agent execution. One test expects status 'CERTIFYING' but receives 'FAILED'.

The 286 warnings all relate to datetime.utcnow deprecation: "DeprecationWarning: datetime.datetime.utcnow() is deprecated and scheduled for removal in a future version. Use timezone-aware objects to represent datetimes in UTC: datetime.datetime.now(datetime.UTC)." AgentContext and AgentResult dataclasses use datetime.utcnow() as default_factory (lines 47, 65 in agent_coordinator.py).

## Architecture boundary enforcement

DiscoveryClient in repository/discovery_client.py correctly enforces "Python reads TypeScript snapshot JSON. It does NOT scan the repository independently." The __init__ docstring explicitly states this rule. load_snapshot() reads JSON file only, validates required keys (metadata, applications, packages, services, evidence, findings), caches result. No file system traversal or git operations.

Grep search for `os.walk|pathlib.*glob|Path.*glob` in services/project-ai/ shows only false positives: documentation.py searches evidence array (not files), candidate.py filters uploaded files list, agent_coordinator.py concatenates strings. No Python code scans repository files outside of snapshot consumption.

All agent handlers extract data from context.repository_snapshot frozen snapshot, never call file system operations. Evidence IDs come exclusively from snapshot.evidence array. No synthetic evidence ID generation found.

The only architectural violations are: (1) browser.py playwright import, (2) creation.py path inference from block names.

## EvidenceRecord model and TypeScript interface mapping

EvidenceRecord dataclass in models/evidence.py correctly maps TypeScript Evidence interface field-by-field. All 11 fields present (evidence_id, scanner_name, timestamp, path, kind, claim, locator, content_hash, lifecycle, symbol, metadata). The from_snapshot() classmethod parses snapshot JSON with exact key names (evidenceId, scannerName, contentHash, etc.).

The to_dict() method converts back to camelCase for JSON serialization. Optional fields (symbol, metadata) handled correctly with .get() accessor and conditional inclusion. Module docstring explicitly states "Architecture Rule: Evidence IDs ONLY come from TypeScript snapshot. Python NEVER generates evidence IDs."

## Run directory evidence from .project-ai/runs/

Eight run directories exist: phase2, phase4, r1-setup, r2-setup, r3-setup, r6-setup, r8-setup, r9-setup. Each contains evidence.json file documenting wave implementation. Evidence records include evidenceId (ev-logging-001 format), type (implementation, infrastructure, test, configuration), artifact (file path), claim (human-readable statement), verification (how claim was verified), and status (complete).

Evidence files document: snapshot lifecycle implementation, evidence logging creation, agent handlers, placement manifest enforcement, runtime verification, final gate implementation. Each wave records filesCreated count, testsPassing count, architectureCompliance confirmation. This evidence trail demonstrates waves were implemented as designed.

No actual run directories with {commit-sha}-{snapshot-hash} format exist, only setup directories. This suggests evidence logger tested but not used in actual certification runs yet, or actual runs not committed to repository.

</details>

<details>
<summary>File map</summary>

### Core implementation (services/project-ai/app/)

- **models/evidence.py** — EvidenceRecord dataclass with TypeScript interface mapping
- **evidence/logger.py** — EvidenceLogger with run directory management and JSON logging
- **agents/toolchain.py** — Toolchain analysis agent
- **agents/dependency.py** — Dependency graph analysis agent with cycle detection
- **agents/intake.py** — Candidate classification agent
- **agents/placement.py** — Placement manifest generation (no path inference)
- **agents/governance.py** — Approval workflow with self-approval prevention
- **agents/documentation.py** — Canonical backlog append agent
- **agents/final_gate.py** — Final gate verdict calculation and documentation
- **agents/browser_certification.py** — Browser certification runner (subprocess orchestration)
- **agents/runtime_verification.py** — Runtime verification agent
- **orchestration/agent_coordinator.py** — Agent dispatcher with six handler cases
- **certification/gates.py** — PlacementManifest validation added to all gates
- **verification/runtime.py** — Health checks and process management
- **verification/browser.py** — Playwright integration (⚠️ imports playwright directly)
- **repository/discovery_client.py** — Snapshot reader (no file scanning)
- **api/routes/creation.py** — Certification workflow (⚠️ infers paths from block names)

### Tests (services/project-ai/tests/)

- **agents/** — 47 tests covering all six handlers + final gate + browser certification
- **evidence/test_logger.py** — 10 tests for evidence logging
- **certification/test_gates.py** — Manifest validation tests (5 new tests)
- **verification/test_runtime.py** — 6 tests for health checks and process management
- **integration/** — E2E certification workflow tests

### Infrastructure

- **.project-ai/runs/** — Evidence directory structure with 8 setup directories
- **playwright.project-ai.config.ts** — Sequential execution config (workers: 1)
- **packages/project-llm-discovery/scripts/generate-snapshot.ts** — Snapshot generation script

### Documentation

- **.agents/tasks/m1-m2-backlog.md** — Canonical backlog (appended, not recreated)
- **.agents/tasks/project-ai-remediation-design.md** — Design document
- **.agents/tasks/project-ai-remediation-plan.md** — Implementation plan
- **.agents/policies/canonical-artifact-policy.md** — Append-only policy

**209 files changed, 80,852 insertions, 2,835 deletions**

Full diff: `.agents/tasks/full-diff.txt` (3.3MB)

</details>
