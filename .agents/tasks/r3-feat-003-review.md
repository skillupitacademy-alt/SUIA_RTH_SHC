# In-Memory Store Replacement with PostgreSQL Repositories

This change replaces all five in-memory dictionary stores with PostgreSQL-backed repositories, completing FEAT-003's core requirement: durable persistence for M2.9's canonical workflow system.

The implementation converted `WorkflowGovernanceService` from a stateful singleton to an async service with injected repositories, updated all route handlers for async/await and transaction management, removed the module-level `contracts_store` and `workflows_store` dicts, and added dependency injection throughout the API layer. The FastAPI startup validates database connectivity without mutating schema.

297 out of 313 tests pass (95%). The 16 failures are isolated to FastAPI route tests that need dependency injection mocking updates—core persistence functionality is intact.

**Watch for:** (confirmed) WorkflowGovernanceService's `transition_state` method loads approval from database into a temporary dict for the authorization check, which is correct but creates a pattern that might confuse future maintainers. (confirmed) Some authorization/enforcement utility functions still accept `approvals_store` dicts as parameters rather than repository instances, making them harder to test and maintain. (confirmed) Test failures in contract routes and approval gate tests indicate incomplete test migration from in-memory stores to repository mocks.

**Verdict**: CHANGES_REQUESTED

## High-level view

The governance service transitioned from stateful singleton to dependency-injected async service, replacing two in-memory dicts (`_workflows`, `_approvals`) with three repository interfaces. Route handlers now create the service per-request with repository dependencies, committing transactions explicitly after mutations. Contract and approval routes no longer maintain module-level stores; contracts persist via `ContractRepository`, approvals via `ApprovalRepository`. Authorization checking for the IMPLEMENTING transition loads approval from database into a temporary dict to satisfy existing utility functions—this works but creates a mixed-memory-and-persistence pattern that should be unified. The FastAPI startup calls `validate_database_connectivity()` from FEAT-001, verifying table existence without schema mutations. Test coverage is 95% with failures isolated to FastAPI route test fixtures that haven't migrated from in-memory store assertions to repository mocking.

<details>
<summary>Issues (7)</summary>

1. **Mixed persistence pattern in transition_state** — The IMPLEMENTING transition loads approval from database into a temporary `approvals_store = {}` dict to pass to `can_transition_to_implementing()`. Refactor authorization utilities to accept repositories instead of dicts.
2. **Authorization utilities still dict-based** — Functions like `can_transition_to_implementing()`, `check_implementation_approval()`, and `ApprovalEnforcer.__init__()` accept `approvals_store` dicts rather than repository instances. Migrate these to async functions accepting `ApprovalRepository`.
3. **Test failures in contract routes** — 9 tests in `test_contract_routes.py` fail because they import removed stores. Update fixtures to mock `get_governance_service()` and `get_contract_repository()` dependencies.
4. **Test failures in approval gate** — 7 tests in `test_approval_gate.py` fail because they instantiate `WorkflowGovernanceService()` without dependencies. Update fixtures with mocked repositories.
5. **Legacy dicts in governance.py** — `_approvals`, `_workflow_states`, `_implementation_approvals` dicts remain in `governance.py` for backward compatibility. Remove after test migration completes.
6. **list_workflows simplified implementation** — Currently only queries REQUESTED state. Add pagination and proper filtering before production use.
7. **Docstring claims Wave 2 limitation** — `engineering_contract.py` line 43 mentions in-memory `contracts_store` resets on restart. Update or remove this outdated comment.

</details>

<details>
<summary>Details</summary>

## WorkflowGovernanceService repository conversion

The service constructor accepts `WorkflowRepository`, `ApprovalRepository`, `StateTransitionRepository`, and `AsyncSession`. In-memory dicts removed, all methods async. Domain model mappers translate between ORM and domain objects. Optimistic locking loads current version before upsert. Transaction management: repositories flush, route handlers commit.

**Concern:** `transition_state` loads approval from database into a temporary dict when transitioning to IMPLEMENTING:

```python
approval_model = await self.approval_repo.get_by_workflow(workflow_id)
approvals_store = {}
if approval_model:
    approvals_store[workflow_id] = _approval_model_to_domain(approval_model)

can_implement, auth_reason = can_transition_to_implementing(
    workflow_id=workflow_id,
    approvals_store=approvals_store,  # temporary dict
    ...
)
```

This satisfies the existing `can_transition_to_implementing()` signature but creates a hybrid pattern where persistence is complete but authorization checking still expects in-memory dicts. Functionally correct—loads current approval state from database on every transition—but maintainers might see `approvals_store` and assume in-memory state still exists.

## Workflow routes dependency injection

`workflows.py` removed the module-level singleton and added `get_governance_service()` factory. All six route handlers inject the service via `Depends(get_governance_service)`. Mutation operations inject `session: AsyncSession = Depends(get_db_session)` and call `await session.commit()` after success. Error handling includes `await session.rollback()` before raising HTTPException.

## Contract routes store removal

`contract.py` removed `contracts_store` and `workflows_store`. `create_engineering_contract` checks for existing contract via `contract_repo.get_by_workflow(workflow_id)` (idempotency), persists new contracts via `contract_repo.upsert()`, binds the artifact to the workflow, and transitions state to BRIEF_READY. The try/except around transition passes on `ValueError` for idempotency (workflow might already be in BRIEF_READY). Hash verification in `get_engineering_contract` is automatic—`HashMismatchError` propagates if detected.

## Approval route integration

`approve_placement` injects `governance_service`, `approval_repo`, and `session`. Workflow retrieval via `governance_service.get_workflow()`, approval persistence via `approval_repo.upsert()`, state transition via `governance_service.transition_state()` with session commit/rollback.

**Legacy dicts remain:** `_approvals`, `_workflow_states`, `_implementation_approvals` still declared at module level for backward compatibility with unmigrated tests. Creates confusion about which code paths are production-ready.

## Startup validation connected

`main.py` lifespan calls `validate_database_connectivity()` on startup, which checks engine connectivity and required `project_ai_*` tables exist. No `create_all()`—schema changes are through Drizzle migrations only.

## Authorization utilities accept dicts, not repositories

Authorization functions (`can_transition_to_implementing`, `check_implementation_approval`, `ApprovalEnforcer.__init__`) still accept `approvals_store: Dict[str, ImplementationApproval]` instead of repository instances. They remain synchronous and dict-based. `workflow_governance.py` loads approval from database into a temporary dict to satisfy these signatures—functionally correct but creates a mixed persistence pattern.

## Test suite status

297 tests pass, 16 fail (95% pass rate).

**Failing tests:**
- `test_contract_routes.py` (9 failures) — Import removed stores. Need to mock `get_governance_service()` and `get_contract_repository()` dependencies.
- `test_approval_gate.py` (7 failures) — Instantiate `WorkflowGovernanceService()` without dependencies. Need fixtures with mocked repositories.

</details>

<details>
<summary>File map</summary>

1. **app/orchestration/workflow_governance.py** — Removed `_workflows` and `_approvals` dicts, added repository injection, converted all methods to async, added domain model mappers
2. **app/api/routes/workflows.py** — Removed module-level singleton, added `get_governance_service()` factory, updated all route handlers for dependency injection and transaction management
3. **app/api/routes/contract.py** — Removed `contracts_store` and `workflows_store`, integrated `ContractRepository` and `WorkflowGovernanceService` with async/await
4. **app/api/routes/governance.py** — Updated `approve_placement` with governance service and approval repository injection, added transaction management
5. **app/main.py** — Lifespan manager calls `validate_database_connectivity()` on startup
6. **tests/unit/test_workflow_governance_service.py** — Updated with async fixtures and repository mocks (23 tests passing)
7. **tests/unit/test_workflow_governance.py** — State machine tests (20 tests passing)
8. **tests/unit/test_terminal_states.py** — Terminal state tests (7 tests passing)
9. **.agents/tasks/r3-feat-003-implementation.md** — Implementation report documenting changes and test status

Full diff available via `git diff` against base branch.

</details>
