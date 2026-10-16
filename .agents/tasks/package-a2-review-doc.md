# Transaction-rollback fixture for PostgreSQL integration tests

The implementation adds transaction-level isolation to Project AI integration tests by wrapping test operations in an outer connection transaction that rolls back unconditionally at teardown. The `db_session` fixture now binds sessions to an explicit connection with `join_transaction_mode="create_savepoint"`, which converts `session.commit()` calls into SAVEPOINT releases rather than actual commits. A verification test writes a workflow record, commits it explicitly, and prints its ID for external verification. An external script queries the database independently and confirms the record is absent after teardown.

**Watch for:** The `db_session_factory` fixture does not use the same connection-level transaction pattern as `db_session` (confirmed), the environment guard checks database names but does not verify test-user permissions (likely), and the verification test's external script relies on command-line argument passing which can fail silently if the pytest output is not parsed correctly (possible).

**Verdict**: NEEDS_CHANGES

## High-level view

The `db_session` fixture correctly implements connection-level transaction rollback using `engine.connect()`, `connection.begin()`, and `join_transaction_mode="create_savepoint"`. Teardown calls `await transaction.rollback()` unconditionally, which discards all changes including savepoints created by `session.commit()`. The verification test explicitly commits a workflow record and prints its UUID, and the external verification script opens an independent database connection to confirm the record is absent.

The `db_session_factory` fixture does not implement the same rollback pattern. It wraps operations in an outer session's nested transaction, which is not equivalent to a connection-level transaction with savepoint mode. Tests using this fixture may not roll back committed changes correctly.

The environment guard checks database names against an allow-list but does not verify the connected user's permissions. A test-privileged user connecting to `tutorial_prod` is safer than a write-privileged user, but the guard does not distinguish between them. The guard's purpose is to catch accidental misconfiguration, not to protect production data, which aligns with the stated context (user-confirmed development database).

The verification script takes the workflow ID and database URL as command-line arguments. The test-to-script handoff depends on pytest output parsing by the test runner or the developer. If the `ROLLBACK_VERIFICATION_ID=...` line is not captured or passed correctly, the verification step will fail silently or report the wrong ID.

<details>
<summary>Issues (3)</summary>

1. **db_session_factory rollback asymmetry** (confirmed) — `db_session_factory` uses `begin_nested()` instead of connection-level transaction with savepoint mode. Restart tests using this fixture may not roll back committed changes. Refactor to use the same connection-level pattern as `db_session`.

2. **Environment guard does not check permissions** (likely) — `_verify_database_environment` checks database name but not the connected user's role or permissions. A misconfigured connection with elevated permissions would pass the guard. Add a permission check or document that the guard only prevents wrong-database mistakes, not privilege escalation.

3. **Verification script handoff relies on output parsing** (possible) — The external verification script expects `workflow_id` and `DATABASE_URL` as command-line arguments. The test prints the ID to stdout, but the handoff mechanism (pytest runner parsing output, or manual copy-paste) is not specified. If the output is not captured or passed incorrectly, the verification will test the wrong ID or fail. Document the expected handoff or integrate the verification into the test itself.

</details>

<details>
<summary>Details</summary>

## db_session fixture implements connection-level rollback correctly

The `db_session` fixture opens an explicit connection with `integration_db_engine.connect()`, starts a transaction with `connection.begin()`, and binds the session to that connection with `join_transaction_mode="create_savepoint"`. This configuration converts `session.commit()` calls into `SAVEPOINT` releases instead of actual `COMMIT` statements, which allows the outer connection transaction to roll back all changes unconditionally at teardown:

```python
async with integration_db_engine.connect() as connection:
    async with connection.begin() as transaction:
        async_session_factory = async_sessionmaker(
            bind=connection,
            class_=AsyncSession,
            expire_on_commit=False,
            join_transaction_mode="create_savepoint",
        )
        async with async_session_factory() as session:
            yield session
        await transaction.rollback()
```

The teardown step `await transaction.rollback()` is placed outside the session context manager and rolls back the connection transaction regardless of what the test did. The verification test explicitly calls `await db_session.commit()` after upserting a workflow record, which confirms that the fixture can roll back committed operations.

## db_session_factory fixture does not use the same rollback pattern

The `db_session_factory` fixture is intended for restart simulation tests. It wraps operations in an outer session's nested transaction (`begin_nested()`), but it does not use the connection-level transaction pattern with `join_transaction_mode="create_savepoint"`:

```python
async with async_session_factory() as outer_session:
    async with outer_session.begin():
        nested_transaction = await outer_session.begin_nested()
        
        async def _factory():
            return outer_session
        
        yield _factory
        
        await outer_session.rollback()
```

The factory returns the same `outer_session` for all calls, and the teardown rolls back that session. However, `begin_nested()` creates a SAVEPOINT, not an outer connection transaction. If a test calls `session.commit()` on the outer session, SQLAlchemy may commit the session's transaction depending on how the session was created. The fixture does not configure `join_transaction_mode="create_savepoint"`, which means `session.commit()` might issue an actual `COMMIT` instead of releasing a savepoint.

This asymmetry between `db_session` and `db_session_factory` creates a risk: restart tests using `db_session_factory` may not roll back committed changes correctly. The fixture should be refactored to use the same connection-level transaction pattern as `db_session`.

## Environment guard checks database names but not permissions

The `_verify_database_environment` function extracts the database name from the connection string and checks it against an allow-list:

```python
allowed = {"tutorial_prod", "project_ai_test", "tutorial_test"}
if db_name not in allowed:
    pytest.fail(...)
```

This guard catches accidental misconfiguration (connecting to the wrong database), but it does not verify the connected user's permissions. A user with `INSERT`, `UPDATE`, `DELETE` privileges on `tutorial_prod` would pass the guard, even if the intended test user should have read-only access or restricted write access.

The stated context indicates that `tutorial_prod` is a user-confirmed development database, which means the guard's purpose is to prevent wrong-database mistakes, not to protect production data. However, the guard does not document this limitation. If the guard's scope is configuration validation only, that should be stated explicitly. If permission verification is intended, the guard should query the user's role or permissions after connecting.



## Verification script handoff depends on output parsing

The external verification script expects the workflow ID and database URL as command-line arguments:

```python
if len(sys.argv) != 3:
    print("Usage: verify_rollback.py <workflow_id> <DATABASE_URL>")
    sys.exit(2)

wf_id, db_url = sys.argv[1], sys.argv[2]
```

The test prints the ID to stdout with the format `ROLLBACK_VERIFICATION_ID=<uuid>`, but the mechanism for extracting this value and passing it to the script is not specified. If the test is run manually, the developer must copy the ID from the pytest output and invoke the script. If the test is run by a CI pipeline, the pipeline must parse the pytest output and extract the ID. If the output is not captured or parsed correctly, the verification will test the wrong ID or fail silently.

This handoff risk could be mitigated by integrating the verification into the test itself (using a separate async session within the test), or by documenting the expected handoff mechanism explicitly.



</details>

<details>
<summary>File map</summary>

- `services/project-ai/tests/integration/conftest.py` — db_session fixture with connection-level rollback, db_session_factory fixture with nested transaction, environment guard, PostgreSQL engine setup
- `services/project-ai/tests/integration/test_transaction_rollback.py` — verification test that commits a workflow record and prints its ID
- `services/project-ai/tests/integration/verify_rollback.py` — external script that queries the database independently and confirms the record is absent

Full diff: compare against the base branch with `git diff main -- services/project-ai/tests/integration/`.

</details>
