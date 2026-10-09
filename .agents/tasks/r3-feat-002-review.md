# ORM models and repositories for M2.9 R3 persistence

FEAT-002 implements the SQLAlchemy ORM layer and repository pattern for Project AI's durable persistence. Five domain models (workflows, contracts, candidates, manifests, approvals) plus state transitions now have ORM mappings, typed repository protocols, PostgreSQL implementations with ON CONFLICT upserts, optimistic locking on workflows, and hash verification for immutable artifacts. The implementation report shows 308/308 unit tests passing with no regressions.

**Watch for:** String primary keys instead of UUIDs (confirmed), no hash verification on workflow artifacts (confirmed), incomplete optimistic locking (likely), repository factory pattern doesn't integrate cleanly with FastAPI Depends (confirmed), no domain model mappers (confirmed).

**Verdict**: NEEDS_CHANGES

## High-level view

All five models use string primary keys (varchar 255) instead of PostgreSQL UUID columns, despite the blocking criteria requiring "UUID primary keys" and "uuid4 default". This creates ID collision risk and loses database-level UUID guarantees. The workflow model has a version column for optimistic locking, but the upsert implementation reads then writes in two statements instead of using ON CONFLICT with a version WHERE clause, opening a race condition window. Hash verification functions exist for contracts and manifests but are never called automatically — callers must remember to invoke verify_hash manually after reads, which is error-prone. The repository factory functions require manual session passing and can't be used directly with FastAPI Depends() despite the blocking criteria requiring "Depends()-compatible factory functions". No domain model mappers exist to convert between ORM models (WorkflowModel) and domain dataclasses (ProjectLLMWorkflow), forcing FEAT-003 to handle impedance mismatch throughout the integration layer.

<details>
<summary>Issues (8)</summary>

1. **String PKs instead of UUID columns** — Change all primary key columns from String(255) to UUID with server_default=text("gen_random_uuid()"). Update repositories to handle UUID types instead of strings. (confirmed)

2. **Optimistic lock race window** — Rewrite workflow upsert to use ON CONFLICT with a WHERE version = expected_version clause, not read-then-check-then-write. Current pattern allows concurrent updates between the read and write. (confirmed)

3. **Hash verification never called** — Either make verify_hash automatic in repository.get(), or provide a verified_get() method that raises on mismatch. Leaving verification to the caller means it will be forgotten. (confirmed)

4. **Workflow artifact hashes not verified on read** — WorkflowModel has contract_sha256, candidate_sha256, manifest_sha256 columns but no verify_artifact_hashes() method. After restart, tampered artifact bindings go undetected. (confirmed)

5. **Factory pattern breaks Depends()** — Repository factories raise ValueError if session is None, preventing FastAPI dependency injection. Either use default=Depends(get_db_session) in the signature or restructure as a class with __call__. (confirmed)

6. **No domain model mappers** — Add to_domain() methods on ORM models and from_domain() factory functions on repositories. FEAT-003 will need these to convert between WorkflowModel and ProjectLLMWorkflow. (confirmed)

7. **StateTransitionModel.id uses Identity(always=True)** — PostgreSQL IDENTITY ALWAYS prevents manual ID insertion, breaking any test fixtures or migrations that need deterministic IDs. Use Identity(start=1, increment=1) or SERIAL instead. (likely)

8. **Missing transaction boundary documentation** — Repositories flush but don't commit. Callers must remember await session.commit() or changes are lost. Add a docstring section on transaction management or provide a @transactional decorator. (confirmed)

</details>

<details>
<summary>Details</summary>

## String primary keys instead of UUID type

Blocking criteria #2 requires "UUID primary keys: each model uses UUID PK with uuid4 default". The implementation uses `String(255)` for all primary keys:

```python
workflow_id = Column(String(255), primary_key=True)
contract_id = Column(String(255), primary_key=True)
candidate_id = Column(String(255), primary_key=True)
manifest_id = Column(String(255), primary_key=True)
approval_id = Column(String(255), primary_key=True)
```

This is varchar(255), not PostgreSQL's native UUID type. The FEAT-001 migration uses `varchar(255)` for these columns, so the ORM mapping is consistent with the schema, but both are wrong according to the blocking criteria. Using strings means:

- No database-level UUID validation (accepts any 255-character string as an ID)
- No server-side default generation (application must generate IDs before insert)
- Higher collision risk if ID generation is inconsistent across services
- Lost opportunity for PostgreSQL's UUID indexes and comparison operators

The corrected approach: `workflow_id = Column(UUID(as_uuid=True), primary_key=True, server_default=text("gen_random_uuid()"))`. This gives database-enforced UUID validation, automatic generation for rows inserted without an ID, and native UUID storage (16 bytes instead of 36-byte string). The repositories would need to handle `uuid.UUID` objects instead of strings, and the migration would need to alter the columns from varchar to uuid.

FEAT-003 will inherit this — all workflow IDs will be strings throughout the application layer, not UUID objects.

## Optimistic locking has a race condition

The workflow repository's upsert uses check-then-update instead of an atomic conflict check:

```python
async def upsert(self, workflow: WorkflowModel, expected_version: Optional[int] = None):
    existing = await self.get(workflow.workflow_id)  # Read
    
    if existing is None:
        self.session.add(workflow)
        # ...
        return workflow
    
    # Update path
    if expected_version is not None and existing.version != expected_version:
        raise OptimisticLockError(...)  # Check
    
    workflow.version = existing.version + 1
    await self.session.execute(update(WorkflowModel).where(...).values(...))  # Write
```

Between the `get()` read and the `execute()` write, another transaction can commit a conflicting update. The optimistic lock check runs in application memory after the read, not as a WHERE clause in the UPDATE statement. If two concurrent requests both read version 3, both pass the check (expected_version=3 == existing.version=3), both increment to version 4, and both execute their UPDATE. Second write wins, first write's changes are lost.

PostgreSQL's ON CONFLICT can't help here because the conflict is on version, not on primary key. The correct pattern:

```python
result = await self.session.execute(
    update(WorkflowModel)
    .where(WorkflowModel.workflow_id == workflow.workflow_id)
    .where(WorkflowModel.version == expected_version)  # Atomic check in WHERE clause
    .values(..., version=expected_version + 1)
)

if result.rowcount == 0:
    # Either workflow doesn't exist or version mismatch
    existing = await self.get(workflow.workflow_id)
    if existing is None:
        # Insert path
    else:
        raise OptimisticLockError(...)
```

The WHERE version = expected_version clause makes the version check atomic with the update. If another transaction commits first, rowcount is 0 and the error is raised. The current implementation fails once FEAT-003 wires this to FastAPI routes under gunicorn/uvicorn with multiple workers.

## Hash verification is manual and easily forgotten

ContractRepository and ManifestRepository both have `verify_hash()` methods, but they're never called automatically:

```python
async def verify_hash(self, contract_id: str, data: Dict[str, Any]) -> bool:
    contract = await self.get(contract_id)
    if contract is None:
        return False
    
    canonical = json.dumps(data, sort_keys=True, ensure_ascii=False)
    computed_hash = hashlib.sha256(canonical.encode("utf-8")).hexdigest()
    
    return contract.contract_hash == computed_hash
```

The repository's `get()` method returns the ORM model with the stored hash but doesn't verify it matches the content. Callers must remember to:

```python
contract = await contract_repo.get(contract_id)
if not await contract_repo.verify_hash(contract_id, contract.contract_data):
    raise HashMismatchError(...)
```

This will be forgotten. Two options: make `get()` automatically verify the hash and raise on mismatch, or add a separate `get_verified()` method that does verification. The former is safer (tampered data never leaves the repository), the latter gives callers control (read tampered data for forensics).

## Workflow artifact hash columns exist but are never verified

WorkflowModel stores hash bindings for artifacts:

```python
contract_sha256 = Column(String(64), nullable=True)
candidate_sha256 = Column(String(64), nullable=True)
manifest_sha256 = Column(String(64), nullable=True)
snapshot_sha256 = Column(String(64), nullable=True)
```

These hashes bind the workflow to specific artifact versions. If workflow.contract_sha256 is "abc123..." and the contract's actual hash is "def456...", the binding is broken (artifact was replaced after the workflow captured the hash).

WorkflowRepository has no `verify_artifact_bindings()` method. After a restart, the application loads a workflow from the database, fetches its contract/candidate/manifest, and uses them without checking whether the hashes match. An attacker who gains database write access can update the contract but leave workflow.contract_sha256 unchanged, and the workflow will use the tampered contract.

The correct verification: when loading a workflow, compare workflow.contract_sha256 to the contract's computed hash. This requires cooperation between repositories — WorkflowRepository needs to call ContractRepository.verify_hash(workflow.contract_id, contract.contract_data) and compare the result to workflow.contract_sha256. Or add a WorkflowRepository.load_with_verified_artifacts() that loads the workflow and all artifacts, verifies all hashes, and raises on mismatch.

Without this, the hash-bound security model collapses after restart. Hashes are stored but never checked.

## Repository factories can't be used with FastAPI Depends

The blocking criteria require "Dependency injection: FastAPI Depends()-compatible factory functions exported". The implementation exports factory functions, but they don't work with Depends():

```python
async def get_workflow_repository(session = None) -> WorkflowRepository:
    if session is None:
        raise ValueError("Session must be provided")
    return PostgresWorkflowRepository(session)
```

FastAPI's Depends() calls the function with no arguments and expects it to resolve its own dependencies. The intended usage from the implementation report:

```python
@app.post("/workflows")
async def create_workflow(
    session: AsyncSession = Depends(get_db_session),
    repo: WorkflowRepository = Depends(lambda: get_workflow_repository(session))
):
    # ...
```

This doesn't work. The lambda captures session from the outer scope, but Depends() calls the lambda before the outer dependency is resolved. You get `NameError: name 'session' is not defined` or the lambda captures the wrong session.

Two fixes:

**Option 1: Make session a default parameter that is itself a dependency**

```python
async def get_workflow_repository(
    session: AsyncSession = Depends(get_db_session)
) -> WorkflowRepository:
    return PostgresWorkflowRepository(session)
```

Then `repo: WorkflowRepository = Depends(get_workflow_repository)` works.

**Option 2: Use a class-based dependency**

```python
class WorkflowRepositoryDep:
    def __call__(self, session: AsyncSession = Depends(get_db_session)) -> WorkflowRepository:
        return PostgresWorkflowRepository(session)

get_workflow_repository = WorkflowRepositoryDep()
```

Same usage: `repo: WorkflowRepository = Depends(get_workflow_repository)`.

The current factories work only if you manually pass the session, which defeats the purpose of dependency injection. FEAT-003 will need to rewrite every route to manually wire session and repository instead of using Depends().

## No domain model mappers means FEAT-003 must handle impedance mismatch

The ORM layer defines WorkflowModel, ContractModel, etc., but M2.9's workflow logic uses domain dataclasses (ProjectLLMWorkflow, EngineeringContract from `app/models/workflow_types.py`). These are different types:

- **WorkflowModel**: SQLAlchemy ORM model, has relationships (state_transitions, contract, approval), lazy-loaded attributes, session-bound
- **ProjectLLMWorkflow**: Pydantic dataclass, pure data, no database coupling, used in service layer

FEAT-003 must convert between them at every repository boundary:

```python
# Load from database
workflow_model = await workflow_repo.get(workflow_id)

# Convert to domain model (manual mapping required)
workflow_domain = ProjectLLMWorkflow(
    workflow_id=workflow_model.workflow_id,
    specification_id=workflow_model.specification_id,
    target_family=workflow_model.target_family,
    # ... map 20+ fields manually
)

# Use in service layer
result = governance_service.transition_state(workflow_domain, "CONTRACT_PROPOSED")

# Convert back to ORM model (manual mapping again)
workflow_model.current_state = result.current_state
workflow_model.updated_at = datetime.utcnow()
# ... map all changed fields back
await workflow_repo.upsert(workflow_model)
```

This mapping boilerplate will appear in every route and service method. Standard pattern: add `to_domain()` methods to ORM models and `from_domain()` class methods:

```python
class WorkflowModel(Base):
    # ...
    
    def to_domain(self) -> ProjectLLMWorkflow:
        return ProjectLLMWorkflow(
            workflow_id=self.workflow_id,
            specification_id=self.specification_id,
            # ...
        )
    
    @classmethod
    def from_domain(cls, domain: ProjectLLMWorkflow) -> "WorkflowModel":
        return cls(
            workflow_id=domain.workflow_id,
            specification_id=domain.specification_id,
            # ...
        )
```

Then `workflow_domain = workflow_model.to_domain()` and `workflow_model = WorkflowModel.from_domain(workflow_domain)`. Without this, FEAT-003 will either copy-paste mapping logic everywhere or build the mappers as a first step.

## StateTransitionModel uses IDENTITY ALWAYS

StateTransitionModel defines its auto-increment primary key as:

```python
id = Column(Integer, Identity(always=True), primary_key=True)
```

`Identity(always=True)` creates a PostgreSQL IDENTITY ALWAYS column, which rejects explicit ID values in INSERT statements. You cannot write `INSERT INTO project_ai_state_transitions (id, workflow_id, ...) VALUES (1, 'wf-123', ...)` — PostgreSQL raises an error because IDENTITY ALWAYS means "always generate, never accept user input."

This breaks:

- Test fixtures that need deterministic IDs for assertions
- Migrations that backfill historical data with specific IDs
- Bulk imports from other systems

The usual choice is `Identity(start=1, increment=1)` (IDENTITY BY DEFAULT), which generates IDs by default but allows explicit values if provided. Or use `server_default=text("nextval('project_ai_state_transitions_id_seq')")` with an explicit sequence (the SERIAL pattern).

The impact: FEAT-004 tests cannot create state transitions with known IDs. Assertions must query by workflow_id and timestamp instead of by id, making tests more fragile. Migrations cannot backfill transitions to repair data gaps. The "always" in Identity(always=True) is rarely the right choice outside audit logs that must never accept external IDs.

## Transaction boundaries are implicit and undocumented

All repository methods call `await self.session.flush()` to write changes to the database, but none call `commit()`. From PostgresWorkflowRepository.upsert:

```python
await self.session.flush()
await self.session.refresh(workflow)
return workflow
```

Flush sends SQL to the database but doesn't commit the transaction. The changes are visible within the current session but not to other connections. If the caller forgets to `await session.commit()`, the transaction rolls back when the session closes and all changes are lost. The docstrings don't mention transaction management.

Two fixes:

**Fix 1: Document in repository docstrings**

```python
async def upsert(self, workflow: WorkflowModel) -> WorkflowModel:
    """
    Insert or update workflow.
    
    NOTE: This method flushes but does not commit. Caller must call
    session.commit() to persist changes, or session.rollback() to discard.
    """
```

**Fix 2: Provide a transaction decorator or context manager**

```python
@contextmanager
async def transactional(session: AsyncSession):
    try:
        yield
        await session.commit()
    except Exception:
        await session.rollback()
        raise

# Usage
async with transactional(session):
    await workflow_repo.upsert(workflow)
    await contract_repo.upsert(contract)
# Auto-commits if no exception, auto-rolls back if exception
```

Without either, FEAT-003 will have forgotten commits in some routes, leading to "I wrote to the database but the data disappeared" bugs that only surface under load when sessions close before manual commits happen.

</details>

## File map

<details>
<summary>Files changed (3 new, 1 modified)</summary>

**New files:**

- `services/project-ai/app/persistence/models.py` — SQLAlchemy ORM models for 6 project_ai_* tables (workflows, state transitions, contracts, candidates, manifests, approvals). Uses String(255) PKs, JSON columns, relationships, indexes. 464 lines.

- `services/project-ai/app/persistence/repositories.py` — Repository Protocol interfaces and PostgreSQL implementations. ON CONFLICT upserts, optimistic locking with read-check-write pattern, hash verification methods (manual), exception classes. 814 lines.

- `.agents/tasks/r3-feat-002-implementation.md` — Implementation report documenting what was built, verification results (308/308 tests pass), architecture patterns, known limitations.

**Modified files:**

- `services/project-ai/app/persistence/__init__.py` — Added exports for models, repositories, factories, exceptions. Factory functions require manual session injection.

Full diff available via `git diff main -- services/project-ai/app/persistence/`.

</details>
