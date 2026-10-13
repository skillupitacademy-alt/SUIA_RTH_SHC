# Gate D PostgreSQL Integration Test Infrastructure

Implementation adds PostgreSQL integration test infrastructure enabling real database validation of security contracts (RBAC, brand isolation, identity extraction) and workflow state management for the project-ai service.

The implementation delivers 30 new integration tests distributed across 5 security domains, Docker Compose test database configuration with conflict-free port mapping (55432), environment templates, CI workflow configuration, and complete documentation. Infrastructure uses tmpfs for fast ephemeral storage, graceful skip behavior when unconfigured, and transaction-based test isolation.

**Watch for:** (confirmed) JWT secrets in .env.test.example meet minimum length but should never be copied to production; (confirmed) tests require explicit TEST_DATABASE_URL_TUTORIAL configuration and skip when absent; (confirmed) CI workflow depends on Drizzle migrations running before pytest.

**Verdict**: APPROVED

## High-level view

The implementation provides a complete PostgreSQL integration testing foundation with zero infrastructure shortcuts. Docker Compose configuration runs PostgreSQL 17 on non-conflicting port 55432 with tmpfs storage for speed, while CI uses standard port 5432 in clean containers. All 30 tests follow consistent patterns: @pytest.mark.integration and @pytest.mark.asyncio decorators, real database assertions via repository fixtures, transaction rollback isolation. Ten previously-skipped tests in test_authorization.py are now active with full implementations. The graceful skip mechanism prevents false negatives when TEST_DATABASE_URL_TUTORIAL is unconfigured, which is the correct pre-database state. Migration dependency is clearly documented and enforced via fixture validation that checks for project_ai_workflows table existence. Port strategy eliminates the common localhost PostgreSQL conflict without requiring developers to stop their host instance.

<details>
<summary>Issues (3)</summary>

1. **pytest.mark.integration not registered** — pytest emits unknown mark warning for @pytest.mark.integration. Register the mark in pytest.ini or pyproject.toml with `markers = integration: mark test as PostgreSQL integration test`.

2. **TEST_DATABASE_URL_TUTORIAL format inconsistency** — .env.test.example uses `postgresql+asyncpg://` (SQLAlchemy dialect), but CI setup doc and gate-d-ci-setup.md show `postgresql://` in migration step. The migration step needs the plain postgres:// format (for Node.js Drizzle), while Python tests need postgresql+asyncpg://. This is correct but should be explicitly documented to prevent confusion.

3. **No test execution evidence in report** — implementation report claims tests skip gracefully when unconfigured but doesn't show actual test run output with database present. The report shows `--collect-only` output (30 tests collected) but no execution logs. This is acceptable for Gate D review since infrastructure setup is the deliverable, but integration gate should verify actual execution.

</details>

<details>
<summary>Details</summary>

## Test infrastructure and isolation

Session-scoped database engine with function-scoped transaction rollback. Each test's db_session automatically rolls back after completion. The conftest.py fixture validates schema existence by checking for project_ai_workflows table. If absent, tests skip with instructions to run Drizzle migrations.

Skip mechanism operates at collection time via pytest_collection_modifyitems hook. Checks TEST_DATABASE_URL_TUTORIAL and applies skip marker if absent.

Transaction isolation pattern:
```python
async with async_session_factory() as session:
    async with session.begin():
        yield session
        await session.rollback()
```

Tests can insert, update, delete without cleanup logic because rollback is automatic.

## Port mapping strategy eliminates conflicts

Docker Compose uses port 55432:5432 to avoid collision with host PostgreSQL on 5432. Developers don't need to stop their host database to run tests. CI uses 5432:5432 because GitHub Actions provides clean containers.

Environment configuration adapts via TEST_DATABASE_URL_TUTORIAL:
- Local: `postgresql+asyncpg://test_user:test_password@localhost:55432/tutorial_test`
- CI: `postgresql+asyncpg://test_user:test_password@localhost:5432/tutorial_test`

The postgresql+asyncpg:// dialect is required for SQLAlchemy async operations. Plain postgresql:// uses psycopg2 (sync driver), breaking async repository code.

## Test distribution and coverage

All 30 tests present with @pytest.mark.integration and @pytest.mark.asyncio decorators. Domain distribution matches 10-5-5-5-5 requirement:

Domain 1 (RBAC): 10 tests — role-based authorization, super admin bypass, infrastructure portal bypass, empty roles denial, case-insensitive matching, read-only verification, multi-role acceptance, admin token type verification, denial logging.

Domain 2 (Brand Isolation): 5 tests — same-brand access, cross-brand denial, infrastructure bypass, NULL brand protection, brand capture on upload.

Domain 3 (Identity Extraction): 5 tests — JWT user_id extraction, originalUserId extraction, shadowUserId extraction, client-supplied ID rejection, missing claim rejection.

Domain 4 (State Machine): 5 tests — initial state verification, transition recording, approval flow, rejection flow, invalid transition prevention.

Domain 5 (W3/W5 Security): 5 tests — candidate SHA-256 verification, brand independence checking, placement manifest sealing, approval RBAC, tamper detection.

## Removed skip decorators

All 10 @pytest.mark.skip decorators removed from test_authorization.py. Git diff shows 10 removals, grep returns zero matches.

Previously-skipped tests now full integration tests:
1. test_approver_identity_extraction_from_jwt
2. test_requester_identity_extraction_from_jwt
3. test_client_supplied_user_id_ignored
4. test_candidate_upload_captures_brand
5. test_candidate_execute_same_brand_succeeds
6. test_candidate_execute_cross_brand_denied
7. test_candidate_execute_infrastructure_bypass
8. test_null_brand_candidate_requires_privileged_role
9. test_same_brand_workflow_approval_succeeds
10. test_infrastructure_user_cross_brand_access_succeeds

Each uses db_session, workflow_repo, candidate_repo fixtures with real database operations.

## Test quality and patterns

Tests use real database assertions. Examples:
- test_contract_admin_can_create_workflow inserts WorkflowModel, commits, verifies workflow_id and requester_id.
- test_cross_brand_workflow_access_denied creates workflow with brand='skillhub', attempts access with brand='tutorialz', asserts HTTPException 403.
- test_candidate_validator_hash_verification computes SHA-256, inserts candidate, retrieves, asserts candidate_sha256 matches and is 64 hex characters.
- test_placement_manifest_tamper_detection inserts manifest with correct hash, manually corrupts via UPDATE, attempts get(), asserts HashMismatchError with correct entity_type and entity_id.

No time.sleep(), no polling loops. Tests complete as fast as database operations execute.

Tests are idempotent via unique IDs (wf_rbac_001, cand_hash_001, man_seal_001) and transaction rollback.

## CI workflow structure

Critical sequence: checkout → setup Python/Node → install deps → run Drizzle migrations → run pytest. Service container health check (`pg_isready -U test_user`, 5s interval, 3 retries) ensures PostgreSQL ready before tests.

Migration step uses DATABASE_URL=postgresql:// (Node.js driver). Test steps use TEST_DATABASE_URL_TUTORIAL=postgresql+asyncpg:// (SQLAlchemy async). This dialect difference is correct but potentially confusing — should be documented in gate-d-ci-setup.md.

## Documentation completeness

README.md adds "Running Integration Tests" section with prerequisites, start/stop commands, environment setup, test execution commands.

gate-d-ci-setup.md covers service container setup, port differences (CI vs local), environment variables, migration prerequisite, health check, troubleshooting.

.env.test.example documents TEST_DATABASE_URL_TUTORIAL (port 55432), JWT secrets (32+ chars), with header warning test-only values.

docker-compose.test-db.yml: postgres:17, port 55432:5432, tmpfs for /var/lib/postgresql/data, health check.

## Security review

No production credentials in test config. All credentials test-only (test_user/test_password). .env.test.example warns "Never Use in Production".

JWT secrets meet minimum length (32 chars) but are obviously test values. Production secrets should be randomly generated.

Tests verify security contracts:
- test_client_supplied_user_id_ignored confirms route handlers use JWT user_id, not request body
- test_cross_brand_workflow_access_denied confirms brand isolation
- test_placement_approval_requires_contract_admin confirms RBAC on approval
- test_placement_manifest_tamper_detection confirms hash verification detects tampering

Tests assert 403 raised for unauthorized access, not checking for absence of 200. Brand isolation tests assert HTTPException(403) raised with expected details. JWT identity tests verify JWT layer provides user_id, original_user_id, shadow_user_id.

## Infrastructure quality

tmpfs mount provides ephemeral storage (memory-backed), ensuring clean state on each docker-compose up. No persistent volumes means no accumulated test data pollution.

Health check ensures PostgreSQL ready before tests run. Without it, early execution could hit connection refused.

TEST_DATABASE_URL_TUTORIAL uses asyncpg driver (correct async PostgreSQL driver for SQLAlchemy). Using psycopg2 (sync) would break `await session.execute()`.

pytest.mark.integration marker not registered, triggering PytestUnknownMarkWarning. Add `markers = integration: mark test as PostgreSQL integration test` to pytest.ini or pyproject.toml.

## Test execution evidence

Implementation report shows pytest --collect-only output confirming 30 tests collected. Report does not show actual test execution with database running. This is acceptable for Gate D review (infrastructure setup is the deliverable) but means we cannot verify:
- Tests actually connect to PostgreSQL
- Repository operations succeed
- Transaction rollback works correctly
- Test execution time is reasonable

The report states "tests skip gracefully when TEST_DATABASE_URL_TUTORIAL is not configured, which is expected behavior for the implementation phase without a live database." This implies tests were not run against a live database. For Gate D (infrastructure gate), this is acceptable. Integration gate should verify actual execution.

## Files changed

8 files, 2436 additions, 30 deletions. No production code changes. All additive (test infrastructure and documentation).

</details>

<details>
<summary>File map</summary>

Full diff: `git show 8aeef526`

1. `.agents/tasks/gate-d-ci-setup.md` — GitHub Actions service container configuration documentation
2. `.agents/tasks/gate-d-implementation-report.md` — Implementation evidence and verification results
3. `.github/workflows/integration-tests.yml` — CI workflow with postgres service, migrations, pytest execution
4. `services/project-ai/.env.test.example` — Environment template with TEST_DATABASE_URL_TUTORIAL and JWT secrets
5. `services/project-ai/README.md` — Added "Running Integration Tests" section with commands
6. `services/project-ai/docker-compose.test-db.yml` — PostgreSQL 17 container with port 55432, tmpfs, health check
7. `services/project-ai/tests/integration/test_security_integration.py` — 30 integration tests across 5 domains
8. `services/project-ai/tests/security/test_authorization.py` — Removed 10 skip decorators, added full implementations

</details>
