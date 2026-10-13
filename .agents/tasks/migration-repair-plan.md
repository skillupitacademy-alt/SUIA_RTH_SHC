# Implementation Plan: Migration Repair Workflow System

## Executive Summary

This plan implements the Migration Repair Workflow System for Project AI, adding 13 specialized agents organized into 9 waves (W0-W9). The system performs autonomous migration repair, testing, and evidence collection with fail-closed safety gates and comprehensive audit trails.

**Key Architectural Principles:**
- Fail-closed design: BLOCKED/SKIPPED never resolve to PASS
- No production database access during automated repair
- Evidence-first: all operations log to append-only JSONL ledgers
- Sequential execution with explicit dependencies
- Hash-bound artifacts for tamper detection

---

## Wave 0: Foundation Modules (Dependencies: None)

### Implementation Order

- [ ] **1. Create `app/workflows/__init__.py`**
  
  Empty init file to mark as Python package.
  
  **Files:** `services/project-ai/app/workflows/__init__.py`
  
  **Verify:** `python -c "import app.workflows"` succeeds (no import errors)

- [ ] **2. Create `app/workflows/migration_repair/__init__.py`**
  
  Empty init file for migration_repair subpackage.
  
  **Files:** `services/project-ai/app/workflows/migration_repair/__init__.py`
  
  **Verify:** `python -c "import app.workflows.migration_repair"` succeeds

- [ ] **3. Create `app/workflows/migration_repair/models.py`**
  
  Define core enums and dataclasses:
  - `RunStatus` enum: PENDING, RUNNING, PASS, FAIL, BLOCKED
  - `CheckStatus` enum: PASS, FAIL, SKIPPED, BLOCKED
  - `AgentResult` dataclass: workflow_id, agent_id, status, artifact_ids, findings, timestamp
  - `CommandResult` dataclass: exit_code, stdout_path, stderr_path, duration_ms, sha256, timestamp
  - `MigrationFinding` dataclass: object_type, object_name, source_migration, recommended_action, risk (LOW|MEDIUM|HIGH)
  - `VerificationStage` enum: V0 through V10 (sequential stages)
  
  All dataclasses must include `to_dict()` methods for JSONL serialization.
  
  **Files:** `services/project-ai/app/workflows/migration_repair/models.py`
  
  **Verify:** `pytest tests/test_migration_repair_models.py -v` (unit tests pass)

- [ ] **4. Create `app/workflows/migration_repair/safety.py`**
  
  Database safety validation:
  - `DatabaseMode` enum: AUDIT (read-only), VERIFY (disposable), PRODUCTION_MIGRATION (gated)
  - `DatabaseTarget` dataclass: url, name, mode, env (test|staging|production)
  - `FORBIDDEN_PRODUCTION_MARKERS`: tuple = ("prod", "production", "tutorial_prod", "neon-prod")
  - `validate_target(target: DatabaseTarget) -> None`: raises ValueError if production DB in VERIFY mode
  - `is_production_database(db_name: str) -> bool`: checks against forbidden markers
  
  **Files:** `services/project-ai/app/workflows/migration_repair/safety.py`
  
  **Verify:** `pytest tests/test_migration_repair_safety.py -v` (all safety assertions pass)

- [ ] **5. Create `app/workflows/migration_repair/plan.py`**
  
  Define agent dependency graph:
  - `AgentStep` dataclass: id (str), wave (str), dependencies (list[str]), description (str), required (bool)
  - `STEPS`: tuple[AgentStep, ...] with 13 steps mapped to W0-W9
  - `ready_steps(completed: set[str]) -> list[AgentStep]`: returns steps whose dependencies are all in completed
  - `validate_no_cycles() -> bool`: detects circular dependencies
  
  W0: workflow_controller (no dependencies)
  W1: migration_audit, database_safety_audit, test_inventory, evidence_audit (all depend on workflow_controller)
  W2: repair_planner (depends on all W1 agents)
  W3: repair_reviewer (depends on repair_planner)
  W4: repair_implementer (depends on repair_reviewer)
  W5: static_reviewer, test_reviewer (both depend on repair_implementer, can run parallel)
  W6: verification_runner (depends on all W5 agents)
  W7: evidence_assembler (depends on verification_runner)
  W8: final_gate_agent (depends on evidence_assembler)
  W9: publisher_agent (depends on final_gate_agent)
  
  **Files:** `services/project-ai/app/workflows/migration_repair/plan.py`
  
  **Verify:** `pytest tests/test_migration_repair_plan.py -v` (dependency resolution tests pass)

- [ ] **6. Create `app/workflows/migration_repair/runner.py`**
  
  Command execution with evidence capture:
  - `ALLOWED_COMMANDS`: frozenset derived from package.json scripts (db:migrate, test, build, type-check)
  - `run_command(cmd: list[str], cwd: Path, evidence_dir: Path, timeout_sec: int) -> CommandResult`: 
    * Validates cmd[0] against ALLOWED_COMMANDS
    * Async subprocess.create_subprocess_exec
    * Captures stdout/stderr to `{evidence_dir}/{timestamp}-{cmd[0]}-stdout.txt` and stderr.txt
    * Computes SHA-256 of stdout content
    * Returns CommandResult with exit_code, paths, duration_ms, sha256
  - `validate_command(cmd: list[str]) -> None`: raises ValueError if command not in allowlist
  
  Extract allowed commands from package.json: test, build, lint, type-check, db:migrate, db:generate, db:push
  
  **Files:** `services/project-ai/app/workflows/migration_repair/runner.py`
  
  **Verify:** Unit test runs echo command, verifies stdout capture and hash computation

- [ ] **7. Create `app/workflows/migration_repair/gate.py`**
  
  Final gate evaluation (fail-closed):
  - `RequiredCheck` dataclass: check_id (str), description (str), required (bool)
  - `REQUIRED_CHECKS`: tuple of RequiredCheck covering migration_execution, schema_verification, package_tests, integration_tests, security_tests
  - `evaluate_final_gate(check_results: dict[str, CheckStatus]) -> RunStatus`:
    * Returns FAIL if any required check is FAIL
    * Returns BLOCKED if any required check is SKIPPED or BLOCKED
    * Returns PASS only if all required checks are PASS
    * Missing checks treated as BLOCKED
  
  **Files:** `services/project-ai/app/workflows/migration_repair/gate.py`
  
  **Verify:** `pytest tests/test_migration_repair_gate.py -v` (fail-closed behavior verified)

- [ ] **8. Create `app/workflows/migration_repair/verification.py`**
  
  Sequential verification pipeline:
  - `VerificationStage` enum (imported from models.py)
  - `run_verification_pipeline(workflow_id: str, worktree_path: Path, evidence_dir: Path, db_url: str) -> dict`:
    * V0: Create disposable PostgreSQL database
    * V1: Run migrations (pnpm db:migrate)
    * V2: Verify schema (query information_schema for expected objects)
    * V3: Run package tests (pnpm test)
    * V4: Run backend integration tests (pytest services/project-ai/tests/integration/)
    * V5: Run security tests (pytest services/project-ai/tests/security/)
    * V6-V10: Reserved for future stages
    * On stage failure: mark all subsequent stages BLOCKED
    * Returns dict mapping stage -> CheckStatus
  
  **Files:** `services/project-ai/app/workflows/migration_repair/verification.py`
  
  **Verify:** Integration test with mock database verifies stage dependency and BLOCKED propagation

---

## Wave 1: Agent Registry Integration (Dependencies: Wave 0 complete)

- [ ] **9. Modify `app/orchestration/agent_registry.py`**
  
  Add 13 new agent types to AgentType enum:
  - MIGRATION_AUDIT = "migration_audit"
  - DATABASE_SAFETY_AUDIT = "database_safety_audit"
  - TEST_INVENTORY = "test_inventory"
  - EVIDENCE_AUDIT = "evidence_audit"
  - REPAIR_PLANNER = "repair_planner"
  - REPAIR_REVIEWER = "repair_reviewer"
  - REPAIR_IMPLEMENTER = "repair_implementer"
  - STATIC_REVIEWER = "static_reviewer"
  - TEST_REVIEWER = "test_reviewer"
  - VERIFICATION_RUNNER = "verification_runner"
  - EVIDENCE_ASSEMBLER = "evidence_assembler"
  - FINAL_GATE_AGENT = "final_gate_agent"
  - PUBLISHER_AGENT = "publisher_agent"
  
  Add 13 Agent definitions in `_initialize_agents()` method with capabilities:
  
  - **migration_audit**: scan_migration_files, verify_journal_consistency, detect_duplicate_objects, check_dependency_order
  - **database_safety_audit**: validate_db_identity, check_environment, verify_privileges, confirm_backup_plan
  - **test_inventory**: discover_test_files, validate_test_fixtures, check_integration_tests, verify_security_tests
  - **evidence_audit**: scan_evidence_ledgers, verify_jsonl_integrity, check_artifact_locations, validate_hashes
  - **repair_planner**: analyze_findings, map_to_migrations, propose_corrections, assess_risk
  - **repair_reviewer**: review_repair_plan, check_migration_history, reject_destructive_changes, approve_or_block
  - **repair_implementer**: apply_approved_patch, update_canonical_docs, create_disposable_branch, commit_changes
  - **static_reviewer**: check_sql_syntax, verify_migration_order, validate_snapshot_consistency, review_diff_scope
  - **test_reviewer**: verify_test_coverage, check_duplicate_object_tests, validate_downstream_tests
  - **verification_runner**: execute_migration_pipeline, verify_schema, run_package_tests, run_integration_tests
  - **evidence_assembler**: collect_logs, capture_exit_codes, record_junit_results, compute_artifact_hashes
  - **final_gate_agent**: evaluate_all_checks, verify_evidence_completeness, apply_fail_closed_policy, issue_verdict
  - **publisher_agent**: commit_verified_changes, push_to_remote, verify_published_sha, record_audit_trail
  
  Total agent count becomes 28 (15 existing + 13 new).
  
  **Files:** `services/project-ai/app/orchestration/agent_registry.py`
  
  **Verify:** `pytest tests/test_agent_registry.py::test_all_15_agents_registered -v` (update assertion to 28)

- [ ] **10. Modify `app/orchestration/agent_coordinator.py`**
  
  Add dispatch branches in `_execute_agent_capabilities()` for each new agent type:
  
  ```python
  elif agent.agentType == AgentType.MIGRATION_AUDIT:
      from app.workflows.migration_repair.agents.migration_audit import execute_migration_audit
      return await execute_migration_audit(context)
  
  # ... repeat for all 13 new agent types
  ```
  
  Each handler returns AgentResult with status, outputs, evidence_ids, errors.
  
  **Files:** `services/project-ai/app/orchestration/agent_coordinator.py`
  
  **Verify:** Unit test verifies coordinator routes to new handlers without exceptions

---

## Wave 2: Agent Implementations (Dependencies: Wave 1 complete)

- [ ] **11. Create `app/workflows/migration_repair/agents/__init__.py`**
  
  Empty init file for agents subpackage.
  
  **Files:** `services/project-ai/app/workflows/migration_repair/agents/__init__.py`
  
  **Verify:** Import succeeds

- [ ] **12. Create agent implementation files (13 files)**
  
  Create one file per agent, each implementing `async def execute_{agent_name}(context: AgentContext) -> AgentResult`:
  
  - `migration_audit.py`: Scans migration files in packages/db-tutorial/migrations/, reads Drizzle journal, detects duplicate CREATE statements
  - `database_safety_audit.py`: Parses DATABASE_URL_TUTORIAL, validates not production-named, checks env vars
  - `test_inventory.py`: Discovers pytest files in services/project-ai/tests/, checks for existing migration tests
  - `evidence_audit.py`: Reads .agents/evidence/*.jsonl, validates JSON integrity, checks for hash mismatches
  - `repair_planner.py`: Aggregates findings from W1 agents, proposes minimal schema-preserving patches
  - `repair_reviewer.py`: Checks proposed patches don't duplicate earlier migrations, rejects destructive changes
  - `repair_implementer.py`: Creates git worktree, applies approved patches, updates relevant docs, commits locally
  - `static_reviewer.py`: Runs SQL syntax checks, verifies migration order, validates Drizzle snapshot consistency
  - `test_reviewer.py`: Ensures tests exist for duplicate object failures, checks coverage of downstream functionality
  - `verification_runner.py`: Calls run_verification_pipeline() from verification.py, marks stages BLOCKED on failure
  - `evidence_assembler.py`: Collects all stdout/stderr/exit codes, writes to .agents/evidence/migration-repair-{workflow_id}.jsonl
  - `final_gate_agent.py`: Calls evaluate_final_gate() from gate.py, returns PASS/FAIL/BLOCKED
  - `publisher_agent.py`: After PASS, pushes commit, verifies remote SHA matches local, writes audit record
  
  Each agent must:
  1. Log start/completion to evidence ledger via `app.evidence.ledger.append_agent_run()`
  2. Return AgentResult with populated evidence_ids
  3. Handle exceptions gracefully, returning FAILED status with error message
  4. Never mutate state outside approved scope (e.g., repair_implementer only writes to worktree)
  
  **Files:** 13 files in `services/project-ai/app/workflows/migration_repair/agents/`
  
  **Verify:** Unit tests for each agent verify evidence logging and error handling

---

## Wave 3: Testing Infrastructure (Dependencies: Wave 2 complete)

- [ ] **13. Create `tests/test_migration_repair_models.py`**
  
  Unit tests for models.py:
  - Test RunStatus enum has all 5 values
  - Test CheckStatus enum has all 4 values
  - Test AgentResult.to_dict() serialization
  - Test CommandResult includes all required fields
  - Test MigrationFinding risk levels
  - Test VerificationStage sequential ordering (V0 < V1 < ... < V10)
  
  **Files:** `services/project-ai/tests/test_migration_repair_models.py`
  
  **Verify:** `pytest tests/test_migration_repair_models.py -v` (all tests pass)

- [ ] **14. Create `tests/test_migration_repair_safety.py`**
  
  Unit tests for safety.py:
  - Test validate_target() raises ValueError for production DB in VERIFY mode
  - Test validate_target() allows production DB in PRODUCTION_MIGRATION mode
  - Test validate_target() allows any DB in AUDIT mode
  - Test is_production_database() detects all forbidden markers
  - Test DatabaseTarget creation with valid/invalid combinations
  
  **Files:** `services/project-ai/tests/test_migration_repair_safety.py`
  
  **Verify:** `pytest tests/test_migration_repair_safety.py -v` (all safety tests pass)

- [ ] **15. Create `tests/test_migration_repair_plan.py`**
  
  Unit tests for plan.py:
  - Test STEPS contains exactly 13 AgentSteps
  - Test ready_steps() returns W0 agent when completed={}
  - Test ready_steps() returns W1 agents when completed={W0}
  - Test ready_steps() returns empty when circular dependency detected
  - Test validate_no_cycles() returns True for valid DAG
  - Test wave ordering W0 < W1 < W2 < ... < W9
  
  **Files:** `services/project-ai/tests/test_migration_repair_plan.py`
  
  **Verify:** `pytest tests/test_migration_repair_plan.py -v` (dependency resolution tests pass)

- [ ] **16. Create `tests/test_migration_repair_gate.py`**
  
  Unit tests for gate.py:
  - Test evaluate_final_gate() returns FAIL when required check is FAIL
  - Test evaluate_final_gate() returns BLOCKED when required check is SKIPPED
  - Test evaluate_final_gate() returns BLOCKED when required check is BLOCKED
  - Test evaluate_final_gate() returns BLOCKED when required check is missing
  - Test evaluate_final_gate() returns PASS only when all required checks are PASS
  - Test non-required checks don't block PASS verdict
  
  **Files:** `services/project-ai/tests/test_migration_repair_gate.py`
  
  **Verify:** `pytest tests/test_migration_repair_gate.py -v` (fail-closed behavior verified)

- [ ] **17. Update `tests/test_agent_registry.py`**
  
  Modify existing tests to account for 28 agents (was 15):
  - Update `test_all_15_agents_registered()` assertion: `assert len(agents) == 28`
  - Update `test_agent_types_enum_complete()` assertion: `assert len(agent_types) == 28`
  - Add `test_migration_repair_agents_registered()` to verify all 13 new agents exist
  - Verify new agent capabilities are not empty or stub
  
  **Files:** `services/project-ai/tests/test_agent_registry.py`
  
  **Verify:** `pytest tests/test_agent_registry.py -v` (all tests pass with 28 agents)

---

## Wave 4: Integration Testing (Dependencies: Wave 3 complete)

- [ ] **18. Create `tests/integration/test_migration_repair_workflow.py`**
  
  Integration tests for full workflow execution:
  - Test W0 agent (workflow_controller) initializes successfully
  - Test W1 agents can run in parallel and return valid AgentResults
  - Test W2 agent (repair_planner) receives W1 outputs in context
  - Test verification_runner creates disposable database and runs migrations
  - Test final_gate_agent correctly evaluates check results
  - Test publisher_agent only runs when final_gate_agent returns PASS
  - Test workflow stops on W3 rejection and marks downstream agents BLOCKED
  
  Requires TEST_DATABASE_URL_TUTORIAL configured to run database tests.
  
  **Files:** `services/project-ai/tests/integration/test_migration_repair_workflow.py`
  
  **Verify:** `pytest tests/integration/test_migration_repair_workflow.py -v` (integration tests pass)

- [ ] **19. Create `tests/integration/test_migration_repair_evidence.py`**
  
  Integration tests for evidence ledger:
  - Test agent_run records appended to .agents/evidence/agent-runs.jsonl
  - Test command stdout/stderr captured to evidence directory
  - Test SHA-256 hashes computed correctly for artifacts
  - Test evidence_assembler collects all execution records
  - Test evidence files survive workflow failure (append-only contract)
  
  **Files:** `services/project-ai/tests/integration/test_migration_repair_evidence.py`
  
  **Verify:** `pytest tests/integration/test_migration_repair_evidence.py -v` (evidence integrity verified)

---

## Wave 5: Documentation and Examples (Dependencies: Wave 4 complete)

- [ ] **20. Create `docs/migration-repair-workflow.md`**
  
  Comprehensive documentation covering:
  - Architecture overview with DAG diagram
  - Agent responsibilities for each of 13 agents
  - Safety constraints (production database protection)
  - Evidence requirements and ledger format
  - How to add new verification stages
  - How to extend ALLOWED_COMMANDS
  - Troubleshooting guide for common failures
  
  **Files:** `docs/migration-repair-workflow.md`
  
  **Verify:** Manual review confirms all agents documented

- [ ] **21. Create example workflow execution script**
  
  Script demonstrating workflow usage:
  - `scripts/run-migration-repair.py`: CLI script that:
    * Creates workflow_id
    * Initializes AgentCoordinator
    * Executes agents in DAG order via execute_dag()
    * Logs progress to stdout
    * Writes final report to .agents/tasks/migration-repair-{workflow_id}-report.json
  
  **Files:** `scripts/run-migration-repair.py`
  
  **Verify:** Run script with --dry-run flag, verify it logs agent execution plan without mutations

---

## Verification Strategy

### Unit Test Coverage Target: 85%

Run after each wave completion:
```bash
pytest services/project-ai/tests/ --cov=app.workflows.migration_repair --cov-report=term --cov-report=html
```

### Integration Test Prerequisites

1. Start test database:
```bash
docker-compose -f services/project-ai/docker-compose.test-db.yml up -d
```

2. Set environment:
```bash
export TEST_DATABASE_URL_TUTORIAL=postgresql+asyncpg://user:pass@localhost:55432/tutorial_test
```

3. Run integration tests:
```bash
pytest services/project-ai/tests/integration/test_migration_repair_*.py -v
```

### End-to-End Verification

1. Create disposable test migration with duplicate object
2. Run migration repair workflow via CLI script
3. Verify workflow detects duplicate, proposes fix, applies patch, runs tests
4. Verify evidence ledger contains all agent runs
5. Verify final gate returns PASS
6. Verify no production database was touched

---

## Safety Checklist

Before marking implementation complete, verify:

- [ ] `validate_target()` raises on production DB in VERIFY mode
- [ ] `evaluate_final_gate()` returns BLOCKED when any check is SKIPPED
- [ ] `evaluate_final_gate()` returns BLOCKED when any check is BLOCKED
- [ ] Evidence ledger uses append-only writes (never truncates)
- [ ] `ALLOWED_COMMANDS` only includes safe build/test commands
- [ ] `run_command()` rejects commands not in allowlist
- [ ] All agent implementations log to evidence ledger
- [ ] Workflow stops on W3 reviewer rejection (doesn't proceed to W4)
- [ ] `verification_runner` marks subsequent stages BLOCKED on failure
- [ ] `publisher_agent` verifies remote SHA matches local before success

---

## Constraints and Non-Goals

### What This Implementation DOES

✅ Autonomous migration repair for development/test databases  
✅ Comprehensive evidence collection in append-only ledgers  
✅ Fail-closed safety gates preventing silent failures  
✅ Hash-bound artifacts for tamper detection  
✅ Sequential execution with explicit dependencies  
✅ Integration with existing Project AI agent registry  

### What This Implementation DOES NOT DO

❌ Automatic repair of production databases (requires separate gated workflow)  
❌ Migration rollback or undo operations (one-way forward only)  
❌ Schema breaking changes (only schema-preserving patches)  
❌ Human approval bypass (final gate can block without override)  
❌ Parallel agent execution within waves (sequential for safety)  
❌ Real-time streaming progress UI (log-based only)  

---

## Dependencies on Existing Systems

1. **Evidence Ledger** (`app/evidence/ledger.py`): All agents must use `append_agent_run()` and `append_test_result()`
2. **Agent Registry** (`app/orchestration/agent_registry.py`): Extends to 28 agents total
3. **Agent Coordinator** (`app/orchestration/agent_coordinator.py`): Routes execution to new handlers
4. **Persistence Layer** (`app/persistence/`): No new tables required; uses existing evidence storage
5. **Package.json Scripts**: Extracts allowed commands for runner.py allowlist

---

## Success Criteria

Implementation is complete when:

1. All 21 plan items have passing verification steps
2. Unit test coverage ≥ 85% for `app/workflows/migration_repair/`
3. Integration tests pass with TEST_DATABASE_URL_TUTORIAL configured
4. `pytest tests/test_agent_registry.py -v` shows 28 agents registered
5. Safety tests verify production database protection
6. Example workflow execution script runs without errors
7. Evidence ledger contains complete audit trail for sample workflow
8. Documentation covers all 13 agents and their responsibilities

---

## Estimated Implementation Effort

- Wave 0 (Foundation): 8 items, ~4-6 hours
- Wave 1 (Registry): 2 items, ~2-3 hours
- Wave 2 (Agents): 2 items, ~8-12 hours (13 agent implementations)
- Wave 3 (Testing): 5 items, ~4-6 hours
- Wave 4 (Integration): 2 items, ~3-4 hours
- Wave 5 (Documentation): 2 items, ~2-3 hours

**Total Estimated Effort: 23-34 hours**

---

## Notes for Implementer

1. **Start with Wave 0** — All foundation modules must be complete before proceeding to Wave 1
2. **Use existing patterns** — Study `app/evidence/ledger.py` and `app/orchestration/agent_coordinator.py` for coding style
3. **Fail-closed is mandatory** — Never allow SKIPPED or BLOCKED to resolve to PASS
4. **Evidence is append-only** — Never truncate or modify existing JSONL content
5. **Test as you go** — Run unit tests after each file creation, not at the end
6. **Production databases are off-limits** — Safety checks must be unbreakable
7. **Sequential execution** — Do not attempt to parallelize agents within waves without explicit approval

---

**Plan Version:** 1.0  
**Created:** 2025-01-XX  
**Target Service:** `services/project-ai`  
**Target Python Version:** 3.11+  
**Dependencies:** asyncio, pytest, sqlalchemy, pydantic
