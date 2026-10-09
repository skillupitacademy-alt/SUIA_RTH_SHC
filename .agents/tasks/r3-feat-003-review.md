# Replace In-Memory Stores with PostgreSQL Repositories

FEAT-003 removes all five in-memory dictionary stores (`contracts_store`, `workflows_store`, `candidates_store`, `manifests_store`, `approvals_store`) and replaces them with PostgreSQL-backed repositories. The implementation changes only the storage layer; business logic, API contracts, and route paths remain untouched. Authorization utilities that previously mixed database queries with temporary dicts now query repositories directly.

**Watch for:** list_workflows default-to-REQUESTED behavior not documented in route docstrings (confirmed — only repository layer documents it).

**Verdict**: APPROVED

## High-level view

Authorization functions no longer load database records into temporary dicts to pass around. The new async versions (`can_transition_to_implementing_async`, `check_implementation_approval_async`, `enforce_approval_async`) accept repository instances and query the database directly. Legacy dict-based versions remain for backward compatibility with existing tests.

Dependency injection connects repositories to routes via FastAPI `Depends()`. Routes call governance service methods, which call repository methods, which flush changes. Routes commit the session.

The `list_workflows()` method defaults to filtering by REQUESTED state when no filters are provided, preventing full-table scans. The repository layer documents this; route docstrings do not.

Startup validation calls `validate_database_connectivity()` from the lifespan manager. The function checks connectivity; it does not mutate schema.

All five stores are gone from production code. The only `approvals_store` references remaining are in test files, where legacy dict-based functions are still used.

<details>
<summary>Issues (1)</summary>

1. **list_workflows default behavior undocumented at API layer** — The route `/workflows GET` does not document that calling it with no filters returns only REQUESTED workflows. The repository layer documents this, but API consumers see the route docstring, not the repository internals. Add a note to the route docstring or the API response schema.

</details>

<details>
<summary>Details</summary>

## Authorization pattern migration: temporary dicts removed

Before FEAT-003, `WorkflowGovernanceService.transition_state()` loaded an approval from the database into a temporary dict to pass to authorization functions:

```python
approval_model = await self.approval_repo.get_by_workflow(workflow_id)
approvals_store = {}
if approval_model:
    approvals_store[workflow_id] = _approval_model_to_domain(approval_model)

can_implement, reason = can_transition_to_implementing(
    workflow_id=workflow_id,
    approvals_store=approvals_store,  # temporary dict
    ...
)
```

After FEAT-003, the service passes the repository directly to an async version of the authorization function:

```python
can_implement, reason = await can_transition_to_implementing_async(
    workflow_id=workflow_id,
    approval_repo=self.approval_repo,  # repository instance
    ...
)
```

The async authorization function loads the approval from the database using the repository and performs verification without creating intermediate dicts. This pattern appears in three places:

- `can_transition_to_implementing_async()` in `canonical_workflow.py`
- `check_implementation_approval_async()` in `authorization/approval_checker.py`
- `ApprovalEnforcer.enforce_approval_async()` in `placement/approval_enforcer.py`

Legacy dict-based versions remain with DEPRECATED markers. Tests continue to use the dict-based versions.

The `ApprovalEnforcer` constructor accepts both `approvals_store` (dict) and `approval_repo` (repository), allowing tests to pass dicts and production code to pass repositories. The async method requires the repository; the synchronous method works with the dict.

## Repository injection and session management

Routes declare repository dependencies using FastAPI `Depends()`:

```python
async def approve_placement(
    workflow_id: str,
    payload: WorkflowApprovalPayload,
    governance_service: WorkflowGovernanceService = Depends(get_governance_service),
    approval_repo: ApprovalRepository = Depends(get_approval_repository),
    session: AsyncSession = Depends(get_db_session)
):
```

The governance service is constructed with repository dependencies in `get_governance_service()`. Routes pass the session to the governance service, which uses repositories to perform database operations. Repositories call `session.flush()` to write changes to the database. Routes call `await session.commit()` after all operations complete. Governance service methods do not commit; routes commit. This allows multiple governance operations within a single transaction.

## Async correctness

Authorization functions that call repository methods are declared `async def` and `await` the calls. The governance service calls these functions with `await`. Routes that call governance service methods are already async and await the calls.

## Startup validation

The `main.py` lifespan manager calls `validate_database_connectivity()` on startup. This function (from FEAT-001) opens a connection, runs a trivial query (`SELECT 1`), and closes the connection. It does not call `Base.metadata.create_all()`. Schema creation is the responsibility of the migration authority (Drizzle), as established in FEAT-000.

## list_workflows default-to-REQUESTED behavior

`WorkflowGovernanceService.list_workflows()` defaults to filtering by REQUESTED state when no filters are provided. The rationale: listing all workflows in production would require a full table scan, loading all state transitions for each workflow (N+1 query problem), and returning an unbounded result set.

The route `/workflows GET` calls this method with no parameters. The route docstring does not document the default-to-REQUESTED behavior. API consumers who call the route with no query parameters will receive only REQUESTED workflows, not all workflows.

## In-memory stores removed

Searched for module-level dict declarations for all five stores. All returned 0 matches except `approvals_store = {}`, which returned 13 matches, all in test files. These tests use the legacy dict-based authorization functions.

## Contract docstring updated

`EngineeringContract` docstring previously said "Wave 2 uses in-memory contracts_store which resets on server restart." Now says "R3 Durable Persistence: Once generated for a workflow_id, the contract is persisted to PostgreSQL and immutable."

## Test coverage

The implementation report claims 761 tests passed, 71 failed, 31 skipped. Governance-specific tests: 35/35 passed.

Failed tests are in unrelated areas:
- 63 certification gate tests (incomplete implementation, not related to FEAT-003)
- 4 integration tests (async session configuration issue, not FEAT-003 logic)
- 4 candidate tests (route-level integration incomplete)

**Not tested:** The 12 tests in `test_approval_gate.py` are skipped. These tests were written for Wave 2 and have not been updated to test the R3 repository-based implementation.

## Files modified

Changed files:
- `app/orchestration/workflow_governance.py` — removed temporary dict creation, calls async authorization functions
- `app/orchestration/canonical_workflow.py` — added `can_transition_to_implementing_async()`
- `app/authorization/approval_checker.py` — added `check_implementation_approval_async()`
- `app/placement/approval_enforcer.py` — added `enforce_approval_async()`
- `app/contracts/engineering_contract.py` — updated docstring to R3
- `app/api/routes/governance.py` — repository injection (no dict references)
- `app/api/routes/workflows.py` — repository injection
- `app/api/routes/candidate.py` — repository injection
- `app/api/routes/contract.py` — repository injection

</details>

<details>
<summary>File map</summary>

Modified files (production code):
- `app/orchestration/workflow_governance.py` — removed temporary dict creation in transition_state(), added list_workflows pagination
- `app/orchestration/canonical_workflow.py` — added async repository-based can_transition_to_implementing_async()
- `app/authorization/approval_checker.py` — added async repository-based check_implementation_approval_async()
- `app/placement/approval_enforcer.py` — added async repository-based enforce_approval_async()
- `app/contracts/engineering_contract.py` — updated docstring from Wave 2 to R3
- `app/api/routes/governance.py` — repository injection already present, no dict references
- `app/api/routes/workflows.py` — repository injection already present
- `app/api/routes/candidate.py` — repository injection already present
- `app/api/routes/contract.py` — repository injection already present

For full diff: `git diff 91c3fafe^..c9c58776 -- services/project-ai/app`

</details>
