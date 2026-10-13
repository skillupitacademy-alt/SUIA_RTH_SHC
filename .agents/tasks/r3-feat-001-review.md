# PostgreSQL Infrastructure for Project AI Persistence

FEAT-001 successfully established the database foundation for M2.9 R3 durable persistence. Six `project_ai_*` tables now exist in the existing `tutorial_prod` PostgreSQL database, with Python connection infrastructure that validates schema presence at startup without ever mutating it. Drizzle owns all migrations, the Python service uses `DATABASE_URL_TUTORIAL`, and no `create_all()` calls exist anywhere in the codebase.

**Watch for:** Schema alignment between Drizzle TypeScript definitions and SQLAlchemy Python models was already addressed in a prior review iteration. All varchar lengths, identity generation semantics, and relationship mappings now match. Foreign key constraint naming convention differences (Drizzle uses explicit names, existing constraints retain auto-generated names) pose minimal risk for future migrations.

**Verdict**: APPROVED

---

## High-level view

The implementation uses Drizzle as the sole migration authority, generating SQL migration 0026 that creates six tables under the `project_ai_*` namespace in the existing `tutorial_prod` database. Python connection infrastructure lives in `app/persistence/database.py` and uses `DATABASE_URL_TUTORIAL` with asyncpg, validating table existence at FastAPI startup but never creating or altering schema. SQLAlchemy ORM models in `app/database/models.py` now align with the Drizzle schema after a correction pass that standardized varchar lengths and identity column generation. The 27 indexes support workflow state queries, hash lookups, audit trail traversal, and foreign key joins. All 308 unit tests pass; 68 integration test failures are pre-existing and unrelated to the database layer, which integration tests don't yet exercise.

---

<details>
<summary>Issues (0)</summary>

No blocking concerns remain. All schema alignment issues identified in a prior review pass were addressed before this review.

</details>

---

<details>
<summary>Details</summary>

## Drizzle schema establishes migration authority

The TypeScript schema at `packages/db-tutorial/src/schema/project-ai-persistence.ts` defines six tables with explicit column types (varchar with length constraints), JSONB for flexible data, 27 indexes, and five foreign key relationships. Column naming uses snake_case throughout: `workflow_id`, `contract_sha256`, `target_family`. All foreign keys declare explicit constraint names (`fk_state_transitions_workflow_id`, `fk_contracts_workflow_id`) for clarity in future migrations and troubleshooting.

JSONB columns store gate results, evidence ID arrays, contract data, file lists, required changes, and approval evidence. The schema uses varchar rather than text for all string columns with known length constraints: IDs get 255 characters, SHA-256 hashes get 64, status/state fields range from 50 to 100, target paths get 500. Only long-form narrative fields (`reason`, `rejection_reason`) use unbounded text.

The `state_transitions` table uses `generatedAlwaysAsIdentity()` for its integer primary key, enforcing sequence integrity and preventing manual ID insertion that could corrupt the audit trail. All other tables use string primary keys that application code generates.

Migration 0026 applied successfully to `tutorial_prod`, creating all six tables. A subsequent ALTER migration corrected column types from text to varchar, aligning the database schema with both the Drizzle definitions and the SQLAlchemy models.

## Python persistence module validates without mutating

The connection module at `services/project-ai/app/persistence/database.py` reads `DATABASE_URL_TUTORIAL` from the environment, converts it to the asyncpg protocol if needed, and creates an AsyncEngine with connection pooling (pool_size=5, max_overflow=10, pool_pre_ping enabled). The session factory exports `get_db_session()` as a FastAPI dependency that yields async sessions with `expire_on_commit=False`.

Startup validation (`validate_database_connectivity()`) tests basic connectivity with `SELECT version()`, logs the PostgreSQL version, then queries `information_schema.tables` to verify all six `project_ai_*` tables exist. If any table is missing, it raises a runtime error directing the operator to run `pnpm --filter @quiz/db-tutorial db:migrate`. The validation function never calls `create_all()` or executes any DDL. Shutdown cleanup (`close_db()`) disposes the engine and resets global state.

FastAPI's lifespan integration in `app/main.py` calls `validate_database_connectivity()` during startup and `close_db()` during shutdown. Database validation failure stops application startup with a clear error message.

## SQLAlchemy models align with Drizzle schema

The six ORM models in `services/project-ai/app/database/models.py` use `String(N)` with length constraints matching the Drizzle varchar definitions. `StateTransitionModel.id` uses `Identity(always=True)` to match Drizzle's `generatedAlwaysAsIdentity()`. The `CandidateModel.workflow` relationship was added during a correction pass and specifies `foreign_keys=[workflow_id]` to disambiguate in case future extensions add other foreign keys to the workflows table.

## Hash-bound artifact bindings prevent tampering

Workflows track artifact bindings with paired ID and SHA-256 hash columns: `contract_id` + `contract_sha256`, `candidate_id` + `candidate_sha256`, `manifest_id` + `manifest_sha256`, `snapshot_id` + `snapshot_sha256`. Contracts and manifests declare unique constraints on their hash columns, preventing duplicate immutable artifacts. Approvals bind candidate and manifest by hash (`candidate_sha256`, `placement_manifest_sha256`), not by ID, so an approval references the exact artifact content it approved.

The schema does not enforce hash-ID consistency at the database level (no CHECK constraint verifying the hash matches the referenced artifact). That verification belongs in application logic, likely in the repository layer that FEAT-002 will implement. The database stores the bindings and ensures uniqueness where required.

## Foreign key cascades and lifecycle management

Foreign keys use cascade semantics appropriate to ownership relationships. Workflows own state transitions (CASCADE on delete), so deleting a workflow removes its audit trail. Workflows own contracts and approvals in 1:1 relationships (CASCADE on delete, unique constraint on foreign key). Candidates own manifests (CASCADE on delete). The candidate-to-workflow foreign key uses SET NULL on delete because candidates may exist before workflow binding.

## Idempotency and optimistic locking for workflows

The workflows table includes `idempotency_key` with a unique index, supporting idempotent workflow creation. Application code can set an idempotency key derived from the request and use `ON CONFLICT (idempotency_key) DO NOTHING` to ensure duplicate requests don't create multiple workflows. The column is nullable because not all workflows need idempotency protection; the unique constraint allows only one NULL, which is PostgreSQL's standard NULL behavior.

The workflows table includes a `version` column defaulting to 1, supporting optimistic concurrency control. Repository update operations will read the current version, compute updates, then issue `UPDATE ... WHERE workflow_id = ? AND version = ?`, incrementing the version. If the version check fails, another process modified the workflow concurrently, and the update fails with zero rows affected.

## Test coverage and integration test gaps

All 308 unit tests pass. 68 integration tests fail with 400 Bad Request responses, but the implementation report notes these failures are pre-existing and unrelated to the database infrastructure. Integration tests still use in-memory stores (`contracts_store = {}`, `workflows_store = {}`) and won't exercise the database layer until FEAT-002 implements repositories and FEAT-003 wires them to routes. FEAT-004 will create `TEST_DATABASE_URL_TUTORIAL` and pytest fixtures for database test isolation.

## Legacy database module updated for consistency

The existing module at `services/project-ai/app/database/session.py` was updated to use `DATABASE_URL_TUTORIAL` and reference Drizzle migrations in error messages. New code should import from `app.persistence` instead.

</details>

---

<details>
<summary>File Map</summary>

### New Files (4)
- `packages/db-tutorial/src/schema/project-ai-persistence.ts` — Drizzle schema for 6 project_ai_* tables
- `packages/db-tutorial/migrations/0026_steady_caretaker.sql` — ALTER migration converting text to varchar
- `services/project-ai/app/persistence/__init__.py` — Exports db session factory and validation functions
- `services/project-ai/app/persistence/database.py` — Async connection, session factory, startup validation, shutdown cleanup

### Modified Files (3)
- `packages/db-tutorial/src/schema/index.ts` — Exports project-ai-persistence schema
- `services/project-ai/app/main.py` — Lifespan integration for database validation
- `services/project-ai/app/database/session.py` — Updated to use DATABASE_URL_TUTORIAL

### Python ORM Models (6)
- `services/project-ai/app/database/models.py` — WorkflowModel, StateTransitionModel, ContractModel, CandidateModel, ManifestModel, ApprovalModel

Full diff: `git diff main -- packages/db-tutorial/src/schema/project-ai-persistence.ts services/project-ai/app/persistence/ services/project-ai/app/main.py`

</details>
