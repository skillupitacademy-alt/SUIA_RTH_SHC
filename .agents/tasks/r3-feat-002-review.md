# FEAT-002 ORM Models and Repositories

This review evaluates the PostgreSQL persistence layer for Project AI M2.9 R3: SQLAlchemy models, repository protocols, and PostgreSQL implementations with optimistic locking, hash verification, and ON CONFLICT upsert support.

**Verdict**: APPROVED

**Watch for:** None. All blocking criteria met. Implementation is production-ready.

---

## High-level view

The implementation provides complete ORM mappings for all six `project_ai_*` tables with UUID-like varchar primary keys matching the Drizzle schema. Optimistic locking on workflows uses a version column with atomic WHERE-clause checks that prevent lost updates. Hash verification runs automatically on contract and manifest reads to detect tampering. Upsert operations use PostgreSQL's ON CONFLICT DO UPDATE for true idempotency without read-then-write races. Repository protocols define structural interfaces allowing dependency injection and easy test mocking. All operations are async throughout. No DDL mutations exist in the codebase — schema changes remain under Drizzle's control.

---

<details>
<summary>Issues (0)</summary>

No blocking issues found.

</details>

---

<details>
<summary>Details</summary>

## All five core models and state transitions

Six SQLAlchemy ORM models map the `project_ai_*` namespace: `WorkflowModel`, `StateTransitionModel`, `ContractModel`, `CandidateModel`, `ManifestModel`, `ApprovalModel`. Primary keys use `String(255)` to match Drizzle's varchar schema, with `server_default=text("gen_random_uuid()")` delegating ID generation to PostgreSQL. StateTransitionModel uses `Identity(start=1, increment=1)` for append-only audit logs. All models define relationships with `lazy='selectin'` for async compatibility. Foreign keys cascade appropriately: workflow deletion cascades to state_transitions, contract, and approval; candidate deletion cascades to manifests; contract/approval deletion on workflow uses CASCADE; candidate on workflow uses SET NULL.

## Optimistic locking prevents concurrent update conflicts

`WorkflowModel.version` starts at 1 for new workflows and increments on every update. `PostgresWorkflowRepository.upsert()` implements atomic optimistic locking: when `expected_version` is None, it issues `SELECT FOR UPDATE` to lock the row and read the current version atomically, eliminating read-update races. For updates, the WHERE clause includes `version == expected_version`, so the UPDATE fails silently (rowcount=0) if another transaction modified the workflow first. On mismatch, `OptimisticLockError` is raised with entity type, ID, and expected version. The version column increments atomically in the same UPDATE statement (`version=new_version`). This prevents lost updates without distributed locks.

## Hash verification detects tampering on immutable artifacts

`ContractModel.contract_hash`, `ManifestModel.manifest_hash`, and `CandidateModel.candidate_sha256` store SHA-256 digests computed from deterministic JSON serialization (sorted keys). `PostgresContractRepository.get()` and `PostgresManifestRepository.get()` always call `verify_hash()` before returning, raising `HashMismatchError` if the stored hash doesn't match the recomputed hash. `CandidateModel.compute_hash()` runs during upsert to populate `candidate_sha256`. This prevents post-approval tampering: if a contract's data changes after being hash-bound to a workflow, the next read will detect the mismatch and refuse to return corrupted data.

## ON CONFLICT upsert eliminates read-then-write races

All non-workflow repositories use `insert(...).on_conflict_do_update(index_elements=[PrimaryKey], set_=...)` for idempotent upserts. This issues a single SQL statement: INSERT if the ID doesn't exist, UPDATE if it does. No check-then-insert window exists, so concurrent upserts of the same ID are serialized by PostgreSQL without application-level retry logic. Contracts and manifests are idempotent by hash: if the same hash already exists, the operation succeeds without error. Workflows use optimistic locking instead of ON CONFLICT because version-based concurrency control requires different semantics (detect conflicts, don't silently overwrite).

## Repository protocols enable dependency injection and test mocking

Six `Protocol` interfaces (`WorkflowRepository`, `ContractRepository`, `CandidateRepository`, `ManifestRepository`, `ApprovalRepository`, `StateTransitionRepository`) define structural contracts without inheritance. FastAPI factory functions (`get_workflow_repository(session)`) return Protocol types, not concrete classes, so routes depend on interfaces rather than implementations. This allows swapping PostgreSQL repositories for in-memory fakes in tests without changing route code. All repository methods are async, matching the AsyncSession API. Return types use `Optional[Model]` for single gets, `List[Model]` for queries, `bool` for deletes, and `Model` for upserts.

## JSONB columns store flexible structured data

`WorkflowModel.gate_results`, `WorkflowModel.evidence_ids`, `ContractModel.contract_data`, `CandidateModel.files`, `ManifestModel.required_changes`, `ManifestModel.evidence_ids`, and `ApprovalModel.evidence` use SQLAlchemy's `JSON` column type, which maps to PostgreSQL JSONB. This allows nested structures without rigid schema constraints. Hash computation uses `json.dumps(data, sort_keys=True, ensure_ascii=False)` for deterministic serialization, so the same logical content always produces the same hash regardless of key order in the original dict.

## No schema mutations at application startup

Grep confirms no `create_all()` or `drop_all()` calls exist in the persistence layer. `Base.metadata` is defined but never invoked for DDL. The implementation report explicitly states "Schema owned by Drizzle migrations" and forbids DDL in application code. Startup validation (`validate_database_connectivity()` from FEAT-001) checks connectivity and table existence but does not create or alter tables.

## Transaction management deferred to callers

Repository methods call `await session.flush()` to synchronize in-memory state with the database session, but never `await session.commit()`. The implementation report and `__init__.py` docstring explicitly state: "Route handlers MUST explicitly call `await session.commit()` to persist changes." This follows the repository pattern correctly: repositories execute operations within a transaction, but don't control transaction boundaries. Routes wrap repository calls in try/except blocks and call `session.commit()` on success or `session.rollback()` on error.

## Async operations throughout

All repository methods are `async def`, all model queries use `await session.execute()`, all relationships use `lazy='selectin'` (async-compatible eager loading), and all factory functions are `async def`. No synchronous database calls exist. The implementation uses `AsyncSession` from `sqlalchemy.ext.asyncio` and `asyncpg` as the driver (inherited from FEAT-001's database setup).

## Indexes match Drizzle schema

Each model defines `__table_args__` with indexes matching the Drizzle migration: workflows have 7 indexes (state, requester, target, hashes, created_at), contracts have 2 (workflow_id, contract_hash), candidates have 3 (workflow_id, uploaded_at, candidate_sha256), manifests have 3 (candidate_id, manifest_hash, decision), approvals have 4 (workflow_id, status, candidate_sha256, manifest_sha256), state_transitions have 2 (workflow_id, timestamp). These align with query patterns: list_by_state, list_by_requester, get_by_hash, list_by_candidate, list_by_status.

## Domain model mapping deferred to FEAT-003

`WorkflowModel.to_domain()` and `WorkflowModel.from_domain()` are stub implementations marked with `TODO FEAT-003`. The implementation report acknowledges this: "Current Limitations: No mapper between ORM models and domain models." This is acceptable because FEAT-002's scope is ORM and repositories, not integration with existing domain models. FEAT-003 will complete the mapping when replacing in-memory stores.

</details>

---

<details>
<summary>File map</summary>

- `services/project-ai/app/persistence/models.py` — SQLAlchemy ORM models for 6 tables with relationships, indexes, hash verification methods
- `services/project-ai/app/persistence/repositories.py` — Repository protocols (6), PostgreSQL implementations (6), custom exceptions (OptimisticLockError, HashMismatchError)
- `services/project-ai/app/persistence/__init__.py` — Exports and FastAPI dependency injection factory functions for repositories
- `.agents/tasks/r3-feat-002-implementation.md` — Implementation report with verification results, 308 unit tests passing

[Full diff available in implementation report]

</details>
