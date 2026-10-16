# Safe PostgreSQL Testing Strategy for Project AI

**Document Version:** 1.0  
**Date:** 2026-10-15  
**Status:** Ready for Review  
**Risk Assessment:** Database writes currently BLOCKED pending isolated test database

---

## Executive Summary

This document provides a concrete, actionable migration plan to move Project AI's test harness from SQLite to PostgreSQL while maintaining database safety in a shared-database environment.

**Current State:**
- Unit tests use SQLite in-memory (1,431 tests) ✅ Safe
- Integration tests use PostgreSQL via `DATABASE_URL_TUTORIAL` (103 tests) ⚠️ Writes to shared database
- Target database `tutorial_prod` is a **shared multi-application database** containing tutorial content, educational architecture, and Project AI operational data

**Critical Finding:**
The current `DATABASE_URL_TUTORIAL` points to a **shared production-grade database** (`tutorial_prod`) containing:
- 18 tutorial content tables (16 records)
- 8 educational architecture tables (54 foundational records)
- 6 Project AI tables (1,713 operational records)
- 2 telemetry tables (706 events)
- 22 Drizzle migration entries

**Safety Recommendation:**
**DO NOT run write-capable integration tests against `tutorial_prod` until an isolated test database is provisioned.**

**Recommended Approach:** Transaction rollback with dedicated test database (Option 2b - see Point 2)

---

## Point 1: conftest.py Migration

### Current State Analysis

**Main conftest.py** (`tests/conftest.py`):
- Creates SQLite in-memory engine with `Base.metadata.create_all`
- Provides `test_db_session` fixture with transaction rollback
- Uses `StaticPool` and `check_same_thread: False` for SQLite

**Integration conftest.py** (`tests/integration/conftest.py`):
- Reads `DATABASE_URL_TUTORIAL` from environment
- Converts `postgresql://` to `postgresql+asyncpg://`
- Removes incompatible query parameters (sslmode, channel_binding)
- Adds `connect_args={"ssl": "require"}`
- Verifies `project_ai_workflows` table exists

### Required Changes

#### Change 1.1: Update Main conftest.py (tests/conftest.py)

**Current code (lines 38-52):**
```python
@pytest_asyncio.fixture
async def test_db_engine():
    """Create an in-memory SQLite database engine for testing."""
    # Use in-memory SQLite for fast tests with transaction rollback
    engine = create_async_engine(
        "sqlite+aiosqlite:///:memory:",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    
    # Create all tables
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    yield engine
    
    # Cleanup
    await engine.dispose()
```

**Proposed change:**

**Option A: Keep SQLite for unit tests (RECOMMENDED)**

No changes required. SQLite remains ideal for unit tests because:
- Fast (in-memory)
- Isolated (no shared state)
- No external dependencies
- Automatic cleanup

The 1,431 unit tests should continue using SQLite.

**Option B: Use PostgreSQL for ALL tests**

```python
@pytest_asyncio.fixture
async def test_db_engine():
    """Create a PostgreSQL database engine for testing."""
    database_url = os.environ.get("DATABASE_URL_TUTORIAL")
    
    if not database_url:
        pytest.skip("DATABASE_URL_TUTORIAL not configured")
    
    # Convert postgresql:// to postgresql+asyncpg://
    if database_url.startswith("postgresql://"):
        database_url = database_url.replace("postgresql://", "postgresql+asyncpg://", 1)
    
    # Remove incompatible parameters (sslmode, channel_binding)
    if "?" in database_url:
        base_url, query_string = database_url.split("?", 1)
        params = [p for p in query_string.split("&") 
                  if not p.startswith(("sslmode=", "channel_binding="))]
        database_url = f"{base_url}?{'&'.join(params)}" if params else base_url
    
    engine = create_async_engine(
        database_url,
        echo=False,
        pool_pre_ping=True,
        pool_size=5,
        max_overflow=10,
        connect_args={"ssl": "require"},
    )
    
    # DO NOT create tables - they must exist from migrations
    # Verify connectivity only
    async with engine.begin() as conn:
        result = await conn.execute(text("SELECT 1"))
        assert result.scalar() == 1
    
    yield engine
    
    await engine.dispose()
```

**RECOMMENDATION:** Use Option A (keep SQLite for unit tests). Only integration tests need PostgreSQL.

#### Change 1.2: Environment Variable Reading

**Current approach:** Integration conftest reads `DATABASE_URL_TUTORIAL` at runtime via `_get_test_db_url()`

**Proposed approach:** Keep current implementation

```python
def _get_test_db_url() -> str | None:
    """Get DATABASE_URL_TUTORIAL at runtime (not import time)."""
    return os.environ.get("DATABASE_URL_TUTORIAL")
```

**Rationale:**
- Runtime reading allows dotenv to load first (via `pytest_configure` hook)
- Avoids import-time environment variable access
- Enables graceful test skipping if not configured

#### Change 1.3: Transaction Rollback Implementation

**Current integration fixture:**
```python
@pytest_asyncio.fixture
async def db_session(integration_db_engine):
    """
    Create an async database session for integration tests.
    
    Tests can call session.commit() and session.flush() freely.
    Uncommitted changes are rolled back at teardown.
    """
    async_session_factory = async_sessionmaker(
        integration_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session_factory() as session:
        yield session
        # Rollback any uncommitted changes
        if session.in_transaction():
            await session.rollback()
```

**Problem:** This fixture allows `session.commit()` which **persists data** to the database.

**Proposed change (SAVEPOINT-based rollback):**

```python
@pytest_asyncio.fixture
async def db_session(integration_db_engine):
    """
    Create an async database session with SAVEPOINT-based rollback.
    
    All operations (including commits) occur within a SAVEPOINT transaction
    that rolls back at test completion. This ensures test isolation even
    when tests call session.commit().
    
    Scope: function (per-test isolation)
    """
    async_session_factory = async_sessionmaker(
        integration_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session_factory() as session:
        # Begin outer transaction
        async with session.begin():
            # Create savepoint for nested transactions
            savepoint = await session.begin_nested()
            
            yield session
            
            # Always rollback to savepoint (discards all test changes)
            await savepoint.rollback()
```

**Benefits:**
- Tests can call `session.commit()` without persisting data
- Full rollback at test completion
- No database cleanup required
- True test isolation

**Tradeoffs:**
- Slightly more complex than current implementation
- Tests that explicitly require restart simulation need separate fixture (already exists: `db_session_factory`)

---

## Point 2: Test Isolation Strategy

### Evaluation of Options

#### Option A: Transaction Rollback (SAVEPOINT)

**Description:** Wrap each test in a transaction with SAVEPOINT, rollback at test completion.

**Implementation:** See Point 1.3 above

**Pros:**
- No schema creation required
- No additional database permissions needed
- Works with shared database (if authorized)
- Fast (no schema creation/teardown)
- True test isolation

**Cons:**
- Tests see uncommitted changes within the same transaction
- Cannot test cross-session behavior (unless using `db_session_factory`)
- Requires support for nested transactions (PostgreSQL supports this)

**Risk Level:** **LOW** (if used with isolated test database)  
**Risk Level:** **HIGH** (if used with `tutorial_prod` - requires explicit authorization)

**Use Cases:**
- Unit integration tests (single session)
- Repository CRUD tests
- Workflow state transition tests
- RBAC/security tests

#### Option B: Dedicated Test Schema

**Description:** Create a separate schema (e.g., `project_ai_test`) within the same database, run tests there.

**Implementation:**
```sql
CREATE SCHEMA IF NOT EXISTS project_ai_test;
SET search_path TO project_ai_test;
-- Run migrations in test schema
-- Tests use project_ai_test schema
-- DROP SCHEMA project_ai_test CASCADE after tests
```

**Pros:**
- Isolated from production schema (`public`)
- Same database connection
- Can test cross-schema scenarios
- Parallel test execution possible (one schema per worker)

**Cons:**
- Requires `CREATE SCHEMA` permission
- Requires schema-qualified table names OR search_path manipulation
- Migration complexity (Drizzle migrations target `public` by default)
- Still shares database resources with other applications
- **Does NOT protect tutorial content in public schema**

**Risk Level:** **MEDIUM** (if used with `tutorial_prod`)  
**Risk Level:** **LOW** (if used with dedicated test database)

**Recommendation:** **DO NOT use with `tutorial_prod`** — While this isolates from the `public` schema, it still shares database resources and migration history with tutorial content system. A misconfigured test could still corrupt data.

#### Option C: Dedicated Test Database

**Description:** Create a completely separate PostgreSQL database for integration tests.

**Implementation:**
```bash
# New environment variable
TEST_DATABASE_URL_TUTORIAL="postgresql://user:pass@host:5432/project_ai_test"

# Migration
pnpm --filter @quiz/db-tutorial db:migrate --database=project_ai_test

# Test configuration
DATABASE_URL_TUTORIAL -> TEST_DATABASE_URL_TUTORIAL (for integration tests only)
```

**Pros:**
- **Complete isolation** from tutorial content
- **Complete isolation** from educational architecture
- **Complete isolation** from operational Project AI data
- Safe to drop/recreate database
- Safe for destructive tests
- No risk to other applications
- Clear separation of concerns

**Cons:**
- Requires provisioning new database
- Requires separate migration management
- Requires updating test configuration
- Slightly slower (network overhead if different host)

**Risk Level:** **NONE (safest option)**

**Recommendation:** ✅ **STRONGLY RECOMMENDED** — This is the only approach that provides complete safety for testing in the current environment.

### Recommended Approach

**OPTION C: Dedicated Test Database** (with SAVEPOINT transaction rollback per test)

**Justification:**

1. **Current `tutorial_prod` is NOT safe for testing:**
   - Shared by multiple applications
   - Contains foundational educational architecture (54 records)
   - Contains tutorial content hierarchy (16 records)
   - Contains operational Project AI data (1,713 records)
   - Contains active telemetry (706 events)

2. **Test schema approach (Option B) insufficient:**
   - Still shares database resources
   - Still shares migration history
   - Risk of accidental cross-schema corruption
   - Complex search_path management

3. **Dedicated database provides complete safety:**
   - Zero risk to tutorial content
   - Zero risk to educational architecture
   - Zero risk to operational data
   - Can be dropped/recreated freely
   - Clear ownership and purpose

**Implementation Steps:**

1. **Provision new database:** Create `project_ai_test` or `tutorial_test` database in Neon
2. **Run migrations:** Apply Project AI schema to new database
3. **Update configuration:** Add `TEST_DATABASE_URL_TUTORIAL` environment variable
4. **Update integration conftest:** Use `TEST_DATABASE_URL_TUTORIAL` if present, fall back to `DATABASE_URL_TUTORIAL` only if explicitly authorized
5. **Implement SAVEPOINT rollback:** Use Point 1.3 implementation for per-test isolation
6. **Document safety:** Update test documentation with new database usage

### Fallback Strategy (if dedicated database unavailable)

**If dedicated test database cannot be provisioned immediately:**

1. **Keep current SQLite approach for all tests** (unit + integration)
2. **Extend SQLite fixtures to cover integration scenarios**
3. **Mock external dependencies** (educational architecture, telemetry)
4. **Run read-only PostgreSQL verification tests** (SELECT only, no writes)
5. **Manual testing against isolated database** (when available)

**Tradeoff:** Reduced PostgreSQL-specific test coverage, but **no risk of data corruption**.

---

## Point 3: Pytest Marker Policy

### Current Markers

**Existing markers:**
- `@pytest.mark.integration` — Requires PostgreSQL via `DATABASE_URL_TUTORIAL`
- `@pytest.mark.asyncio` — Async test (pytest-asyncio)

**Current usage:**
- 103 tests marked with `@pytest.mark.integration`
- Integration tests automatically skip if `DATABASE_URL_TUTORIAL` not configured

### Proposed Marker Taxonomy

#### New Markers

```python
# pyproject.toml [tool.pytest.ini_options]
markers = [
    "integration: marks tests as integration tests requiring PostgreSQL",
    "db_read: marks tests that only perform SELECT queries (safe for any database)",
    "db_write: marks tests that perform INSERT/UPDATE/DELETE (requires isolated test database)",
    "db_migration: marks tests that modify schema (CREATE/ALTER/DROP)",
    "requires_isolated_db: marks tests that must NOT run against shared database",
]
```

#### Marker Definitions

**`@pytest.mark.db_read`**
- Tests that only perform SELECT queries
- Safe to run against any database (including `tutorial_prod`)
- Examples: Schema verification, connectivity tests, table existence checks

**`@pytest.mark.db_write`**
- Tests that perform INSERT, UPDATE, DELETE operations
- **MUST NOT run against `tutorial_prod`**
- Requires isolated test database
- Examples: Repository CRUD tests, workflow state transitions, approval flows

**`@pytest.mark.db_migration`**
- Tests that modify schema (CREATE, ALTER, DROP)
- **MUST NOT run against any shared database**
- Requires disposable test database
- Examples: Migration verification, schema compatibility tests

**`@pytest.mark.requires_isolated_db`**
- Tests that must run against isolated test database
- Automatically skipped if database is not verified as isolated
- Combines `@pytest.mark.integration` + safety check

### Marker Usage Patterns

#### Pattern 1: Read-Only Integration Test

```python
@pytest.mark.integration
@pytest.mark.db_read
@pytest.mark.asyncio
async def test_database_connectivity(db_session):
    """Verify database connectivity (read-only)."""
    result = await db_session.execute(text("SELECT 1"))
    assert result.scalar() == 1
```

**Safety:** Can run against any database, including `tutorial_prod`

#### Pattern 2: Write Integration Test (Current)

```python
@pytest.mark.integration
@pytest.mark.db_write
@pytest.mark.requires_isolated_db
@pytest.mark.asyncio
async def test_workflow_upsert(db_session, workflow_repo):
    """Test workflow upsert (writes to database)."""
    workflow = WorkflowModel(...)
    await workflow_repo.upsert(workflow)
    await db_session.commit()
    # Assertions...
```

**Safety:** Skipped unless isolated test database is configured and verified

#### Pattern 3: Schema Migration Test

```python
@pytest.mark.integration
@pytest.mark.db_migration
@pytest.mark.requires_isolated_db
@pytest.mark.asyncio
async def test_migration_idempotency(db_session):
    """Test that migrations can be run multiple times safely."""
    # Apply migrations twice
    # Verify schema is correct
```

**Safety:** Skipped unless disposable test database is configured

### Marker Enforcement Strategy

#### Enforcement Level 1: Pytest Collection Hook

```python
# tests/integration/conftest.py

def pytest_collection_modifyitems(config, items):
    """
    Enforce marker policy during test collection.
    
    - Skip all integration tests if DATABASE_URL_TUTORIAL not configured
    - Skip db_write/db_migration tests if database not verified as isolated
    """
    db_url = _get_test_db_url()
    
    if not db_url:
        # Skip ALL integration tests
        skip_marker = pytest.mark.skip(
            reason="DATABASE_URL_TUTORIAL not configured"
        )
        for item in items:
            if item.get_closest_marker("integration"):
                item.add_marker(skip_marker)
        return
    
    # Check if database is verified as isolated
    is_isolated = _verify_database_isolation(db_url)
    
    if not is_isolated:
        # Skip write-capable and migration tests
        skip_write_marker = pytest.mark.skip(
            reason="Database not verified as isolated - write tests disabled"
        )
        for item in items:
            if (item.get_closest_marker("db_write") or 
                item.get_closest_marker("db_migration") or
                item.get_closest_marker("requires_isolated_db")):
                item.add_marker(skip_write_marker)


def _verify_database_isolation(db_url: str) -> bool:
    """
    Verify database is safe for write-capable tests.
    
    Returns True if:
    - Database name ends with '_test' or '_dev'
    - Database is explicitly allowlisted
    - Environment variable TEST_DB_ISOLATION_VERIFIED=true is set
    
    Returns False if:
    - Database name contains 'prod'
    - Database is 'tutorial_prod'
    - Cannot determine isolation status
    """
    # Extract database name from URL
    # postgresql://user:pass@host:port/DB_NAME?params
    db_name = db_url.split("/")[-1].split("?")[0]
    
    # Blocklist: Never allow these databases
    blocklist = ["tutorial_prod", "tutorial", "production", "prod"]
    if db_name.lower() in blocklist or "prod" in db_name.lower():
        return False
    
    # Allowlist: Safe database name patterns
    safe_patterns = ["_test", "_dev", "_staging", "_ci"]
    if any(pattern in db_name.lower() for pattern in safe_patterns):
        return True
    
    # Explicit verification via environment variable
    if os.environ.get("TEST_DB_ISOLATION_VERIFIED") == "true":
        return True
    
    # Default: NOT isolated (safe default)
    return False
```

#### Enforcement Level 2: Runtime Safety Check

```python
# tests/integration/conftest.py

@pytest_asyncio.fixture
async def db_session(integration_db_engine):
    """
    Create an async database session with safety checks.
    """
    # Runtime safety check
    db_url = _get_test_db_url()
    if not _verify_database_isolation(db_url):
        # Only allow read-only sessions if database not isolated
        pytest.fail(
            "Database not verified as isolated. "
            "Read-only tests can proceed, but write tests are blocked. "
            "Use @pytest.mark.db_read for read-only tests."
        )
    
    # Proceed with session creation (SAVEPOINT rollback)
    async_session_factory = async_sessionmaker(
        integration_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session_factory() as session:
        async with session.begin():
            savepoint = await session.begin_nested()
            yield session
            await savepoint.rollback()
```

#### Enforcement Level 3: Read-Only Session Fixture

```python
# tests/integration/conftest.py

@pytest_asyncio.fixture
async def readonly_db_session(integration_db_engine):
    """
    Create a read-only database session for safe verification tests.
    
    This fixture can be used with ANY database, including tutorial_prod.
    Tests using this fixture must only perform SELECT queries.
    """
    async_session_factory = async_sessionmaker(
        integration_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session_factory() as session:
        # Set transaction to read-only mode (PostgreSQL)
        await session.execute(text("SET TRANSACTION READ ONLY"))
        
        yield session
        
        # Rollback (no changes possible in read-only mode)
        await session.rollback()
```

**Usage:**

```python
@pytest.mark.integration
@pytest.mark.db_read
@pytest.mark.asyncio
async def test_schema_exists(readonly_db_session):
    """Verify project_ai_workflows table exists (read-only)."""
    result = await readonly_db_session.execute(
        text("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'project_ai_workflows')")
    )
    assert result.scalar() is True
```

### Marker Migration Plan

**Phase 1: Add markers to existing tests (no behavior change)**

1. Add marker definitions to `pyproject.toml`
2. Audit all 103 integration tests
3. Tag each test with appropriate markers:
   - `@pytest.mark.db_read` — Read-only tests
   - `@pytest.mark.db_write` — Write tests
   - `@pytest.mark.requires_isolated_db` — Tests that must have isolation

**Phase 2: Implement enforcement (behavior change)**

4. Add `_verify_database_isolation()` function to integration conftest
5. Add `pytest_collection_modifyitems` enforcement hook
6. Add `readonly_db_session` fixture
7. Update existing `db_session` fixture with safety checks

**Phase 3: Update test documentation**

8. Update README with marker usage guidelines
9. Document database isolation requirements
10. Provide examples of read-only vs write tests

**Phase 4: Provision isolated test database**

11. Create `project_ai_test` or `tutorial_test` database
12. Run migrations in test database
13. Add `TEST_DATABASE_URL_TUTORIAL` environment variable
14. Set `TEST_DB_ISOLATION_VERIFIED=true` in CI/CD environment
15. Run full integration test suite against isolated database

---

## Point 4: Risk Assessment

### Risk Matrix by Approach

| Approach | Risk Level | What Could Go Wrong | Mitigation | Safe to Proceed? |
|----------|-----------|---------------------|------------|------------------|
| **Continue current approach** (writes to `tutorial_prod`) | 🔴 **CRITICAL** | - Corrupt tutorial content hierarchy<br>- Corrupt educational architecture (54 foundational records)<br>- Pollute operational Project AI data<br>- Interfere with telemetry analytics<br>- Create orphaned test records<br>- Trigger unintended side effects in other services | - STOP running integration tests immediately<br>- Provision isolated test database<br>- Block write tests until isolation verified | ❌ **NO** |
| **Transaction rollback on `tutorial_prod`** | 🔴 **HIGH** | - Locks on shared tables block other applications<br>- Long-running transactions cause connection pool exhaustion<br>- Test failures leave uncommitted locks<br>- Concurrent tests interfere with each other<br>- SAVEPOINT rollback failure leaves committed data | - Provision isolated test database<br>- Use short test transactions<br>- Implement connection pooling limits<br>- Add test timeout enforcement | ❌ **NO** (without explicit authorization) |
| **Dedicated test schema in `tutorial_prod`** | 🟡 **MEDIUM** | - Misconfigured search_path writes to `public` schema<br>- Shared database resources (connections, locks)<br>- Migration conflicts<br>- Schema leak between test and production<br>- DROP SCHEMA failure leaves test data | - Verify search_path in every test<br>- Use schema-qualified table names<br>- Isolated migration management<br>- Schema cleanup verification | ⚠️ **CONDITIONAL** (requires explicit authorization and careful implementation) |
| **Dedicated test database (new DB)** | 🟢 **LOW** | - Network latency (if different host)<br>- Connection pool configuration<br>- Migration drift from production<br>- Test data cleanup between CI runs | - Use same host as `tutorial_prod`<br>- Match connection pool settings<br>- Sync migrations regularly<br>- Implement database reset script | ✅ **YES** |
| **Extended SQLite for all tests** | 🟢 **NONE** | - False positives (SQLite != PostgreSQL)<br>- Missing PostgreSQL-specific features<br>- JSON/JSONB behavior differences<br>- Transaction isolation differences<br>- No true integration testing | - Document PostgreSQL-specific behavior not covered<br>- Add manual PostgreSQL verification tests<br>- Run periodic manual tests against isolated PostgreSQL<br>- Monitor for SQLite/PostgreSQL divergence | ✅ **YES** (fallback option) |
| **Read-only PostgreSQL tests only** | 🟢 **NONE** | - Limited test coverage<br>- Cannot test write operations<br>- Cannot test transactions<br>- Cannot test constraints | - Use read-only session fixture<br>- Document coverage gaps<br>- Supplement with manual testing<br>- Plan for isolated database provisioning | ✅ **YES** (interim solution) |

### Risk Details by Approach

#### Approach 1: Continue Current (Writes to tutorial_prod)

**Risk Level:** 🔴 **CRITICAL** — **UNACCEPTABLE**

**What Could Go Wrong:**

1. **Data Corruption:**
   - Test workflows pollute operational workflow history (822 existing records)
   - Test candidates/contracts interfere with real approval flows
   - Test state transitions corrupt audit trail (398 existing records)

2. **Tutorial Content Damage:**
   - Accidental writes to tutorial hierarchy (16 critical records)
   - Navigation tree corruption breaks tutorial system
   - Content version conflicts

3. **Educational Architecture Damage:**
   - Corruption of foundational domain/subject/topic/skill hierarchy (54 records)
   - Breaks multiple applications dependent on this metadata
   - Difficult to detect and repair

4. **Operational Impact:**
   - Table locks block other applications
   - Connection pool exhaustion
   - Telemetry pollution (688 existing events)
   - Metrics corruption

**Mitigation:**

❌ **NO SAFE MITIGATION** — The only safe mitigation is to **STOP writing to this database**.

**Safe to Proceed:** ❌ **NO**

#### Approach 2: Transaction Rollback on tutorial_prod

**Risk Level:** 🔴 **HIGH** — **NOT RECOMMENDED**

**What Could Go Wrong:**

1. **Database Locks:**
   - Test transactions hold locks on shared tables
   - Other applications blocked waiting for locks
   - Long-running tests cause cascading delays

2. **Connection Pool Exhaustion:**
   - Test suite consumes connection pool slots
   - Production requests fail to acquire connections
   - Neon pooler limits reached

3. **Rollback Failures:**
   - Network interruption leaves transaction open
   - Test crash leaves uncommitted locks
   - SAVEPOINT rollback failure commits test data
   - Process kill bypasses cleanup

4. **Test Interference:**
   - Concurrent tests see each other's uncommitted data
   - Lock timeouts cause flaky tests
   - Test execution order dependencies

**Mitigation:**

1. Use short transactions (< 5 seconds)
2. Implement aggressive connection pool limits
3. Add test timeouts (30 seconds max)
4. Run tests sequentially (not parallel)
5. Monitor database locks in real-time
6. Implement circuit breaker for lock contention
7. **Require explicit written authorization from database owner**

**Safe to Proceed:** ❌ **NO** (without explicit authorization and careful monitoring)

#### Approach 3: Dedicated Test Schema in tutorial_prod

**Risk Level:** 🟡 **MEDIUM** — **CONDITIONAL**

**What Could Go Wrong:**

1. **Search Path Misconfiguration:**
   - Test accidentally writes to `public.project_ai_workflows`
   - Migration runs against wrong schema
   - Schema prefix omitted in raw SQL

2. **Shared Resources:**
   - Database-level locks affect all schemas
   - Connection pool shared with production
   - Autovacuum competes for resources

3. **Migration Conflicts:**
   - Test schema migration conflicts with production migrations
   - Drizzle migration history shared
   - Schema version drift

4. **Cleanup Failures:**
   - `DROP SCHEMA` fails, test data persists
   - Orphaned sequences/indexes in public schema
   - Foreign key constraints leak across schemas

**Mitigation:**

1. Use schema-qualified table names everywhere (`project_ai_test.project_ai_workflows`)
2. Verify search_path in test setup: `SET search_path TO project_ai_test`
3. Separate Drizzle migration history per schema
4. Implement schema cleanup verification
5. Add pre-test schema isolation checks
6. Use connection pooling labels to separate test/prod connections
7. **Require explicit written authorization**

**Safe to Proceed:** ⚠️ **CONDITIONAL** — Acceptable if:
- Explicit authorization granted by database owner
- Schema isolation thoroughly tested
- Monitoring and alerting in place
- Cleanup procedures verified

**Recommendation:** Still prefer dedicated test database over this approach.

#### Approach 4: Dedicated Test Database (NEW DATABASE)

**Risk Level:** 🟢 **LOW** — ✅ **RECOMMENDED**

**What Could Go Wrong:**

1. **Network Latency:**
   - Tests slower if database on different host
   - Connection establishment overhead

2. **Connection Pool Configuration:**
   - Need separate pool size tuning
   - May need different connection parameters

3. **Migration Drift:**
   - Test database schema diverges from production
   - Schema compatibility issues
   - Migration ordering differences

4. **Test Data Accumulation:**
   - Test data accumulates between CI runs
   - Database grows over time
   - Need periodic reset

**Mitigation:**

1. **Same host:** Provision test database on same Neon project (no latency impact)
2. **Connection pooling:** Copy pool configuration from production
3. **Migration sync:** Run identical migrations in test database, verify with schema diff
4. **Database reset:** Implement cleanup script:
   ```bash
   # Option A: Drop/recreate database
   dropdb project_ai_test && createdb project_ai_test
   pnpm --filter @quiz/db-tutorial db:migrate --database=project_ai_test
   
   # Option B: Truncate tables (faster)
   TRUNCATE TABLE project_ai_workflows, project_ai_contracts, ... CASCADE;
   ```
5. **CI/CD integration:** Reset database before each CI run
6. **Schema verification:** Add pre-test check to verify schema matches production

**Safe to Proceed:** ✅ **YES** — This is the safest and most maintainable approach.

**Why This is Best:**

- ✅ **Zero risk** to tutorial content
- ✅ **Zero risk** to educational architecture
- ✅ **Zero risk** to operational data
- ✅ **Complete isolation** — can drop/recreate freely
- ✅ **Clear ownership** — dedicated to Project AI testing
- ✅ **Parallel execution** — no shared resources
- ✅ **Realistic testing** — real PostgreSQL, not SQLite
- ✅ **Future-proof** — supports growth in test coverage

#### Approach 5: Extended SQLite for All Tests

**Risk Level:** 🟢 **NONE** — ✅ **SAFE FALLBACK**

**What Could Go Wrong:**

1. **False Positives:**
   - Tests pass on SQLite but fail on PostgreSQL
   - Behavior differences not detected until production

2. **Missing Features:**
   - PostgreSQL-specific features not tested (JSON operators, full-text search, etc.)
   - Transaction isolation differences (PostgreSQL MVCC vs SQLite locking)
   - Constraint enforcement differences

3. **Type System Differences:**
   - JSONB vs TEXT with JSON
   - TIMESTAMP WITH TIME ZONE handling
   - UUID native type vs TEXT

4. **Concurrency Testing:**
   - Cannot test concurrent transactions (SQLite locks database file)
   - Cannot test connection pooling
   - Cannot test distributed locks

**Mitigation:**

1. **Document coverage gaps:**
   ```markdown
   ## Known SQLite Limitations in Tests
   
   - JSON/JSONB operators not tested (PostgreSQL-specific)
   - Concurrent transaction behavior not tested
   - Connection pooling not tested
   - Native UUID type behavior not tested
   ```

2. **PostgreSQL-specific behavior mocks:**
   ```python
   # Mock PostgreSQL JSON operators in SQLite tests
   # Document assumptions
   ```

3. **Manual verification procedures:**
   ```markdown
   ## Manual PostgreSQL Verification Checklist
   
   - [ ] Run workflow upsert against isolated PostgreSQL
   - [ ] Verify concurrent transaction handling
   - [ ] Test connection pool exhaustion recovery
   - [ ] Verify UUID generation and indexing
   ```

4. **Periodic manual testing:**
   - Weekly manual test run against isolated PostgreSQL
   - Document results in test log
   - Compare SQLite vs PostgreSQL behavior

5. **Plan for future migration:**
   - Mark SQLite approach as temporary
   - Set deadline for dedicated test database provisioning
   - Track feature coverage gaps

**Safe to Proceed:** ✅ **YES** — No risk of data corruption, but reduced test confidence.

**When to Use This:**

- Dedicated test database cannot be provisioned immediately
- Need to run tests NOW without risk
- Interim solution while waiting for database provisioning
- Development/local testing only (not CI/CD)

#### Approach 6: Read-Only PostgreSQL Tests

**Risk Level:** 🟢 **NONE** — ✅ **SAFE INTERIM**

**What Could Go Wrong:**

1. **Limited Coverage:**
   - Cannot test INSERT/UPDATE/DELETE operations
   - Cannot test transactions and rollback behavior
   - Cannot test constraint enforcement
   - Cannot test concurrent writes

2. **False Confidence:**
   - Schema verification passes, but writes might fail
   - Connection works, but permissions might block writes
   - Table exists, but constraints might be broken

**Mitigation:**

1. **Use read-only fixture:**
   ```python
   @pytest.mark.integration
   @pytest.mark.db_read
   async def test_schema_verification(readonly_db_session):
       # Only SELECT queries allowed
   ```

2. **PostgreSQL transaction-level protection:**
   ```sql
   SET TRANSACTION READ ONLY;
   ```
   - Blocks all writes at database level
   - Test failure cannot accidentally write

3. **Document coverage:**
   ```markdown
   ## Read-Only Test Coverage
   
   ✅ Schema existence
   ✅ Table structure
   ✅ Index existence
   ✅ Connectivity
   ✅ Query performance
   
   ❌ Write operations (blocked until isolated DB available)
   ❌ Transaction behavior
   ❌ Constraint enforcement
   ```

4. **Supplement with SQLite write tests:**
   - Use SQLite for write operation unit tests
   - Use PostgreSQL read-only for integration verification
   - Combine both approaches for coverage

**Safe to Proceed:** ✅ **YES** — No risk, but limited test coverage.

**When to Use This:**

- Need to verify PostgreSQL schema compatibility NOW
- Cannot provision dedicated test database immediately
- Want to run SOME integration tests safely
- Complement SQLite-based write tests

---

## Recommended Implementation Plan

### Phase 1: Immediate Safety (Week 1)

**Goal:** Block write-capable tests from running against `tutorial_prod`

**Actions:**

1. ✅ **Add marker enforcement to integration conftest:**
   ```python
   def _verify_database_isolation(db_url: str) -> bool:
       db_name = db_url.split("/")[-1].split("?")[0]
       blocklist = ["tutorial_prod", "tutorial", "production", "prod"]
       return db_name.lower() not in blocklist and "prod" not in db_name.lower()
   
   def pytest_collection_modifyitems(config, items):
       db_url = _get_test_db_url()
       if db_url and not _verify_database_isolation(db_url):
           skip_marker = pytest.mark.skip(
               reason="Database not verified as isolated - write tests disabled. "
                      "Set TEST_DB_ISOLATION_VERIFIED=true to override (DANGEROUS)."
           )
           for item in items:
               if item.get_closest_marker("integration"):
                   item.add_marker(skip_marker)
   ```

2. ✅ **Tag all 103 integration tests with appropriate markers:**
   - Audit each test
   - Add `@pytest.mark.db_read` or `@pytest.mark.db_write`

3. ✅ **Add read-only fixture:**
   ```python
   @pytest_asyncio.fixture
   async def readonly_db_session(integration_db_engine):
       async_session_factory = async_sessionmaker(
           integration_db_engine,
           class_=AsyncSession,
           expire_on_commit=False,
       )
       async with async_session_factory() as session:
           await session.execute(text("SET TRANSACTION READ ONLY"))
           yield session
           await session.rollback()
   ```

4. ✅ **Update test documentation:**
   - Document marker usage
   - Document database safety policy
   - Provide migration guide for existing tests

**Verification:**

```bash
# Run tests - should skip all write tests
pytest tests/integration/ -v

# Expected output:
# tests/integration/test_repositories.py::test_workflow_upsert SKIPPED (database not isolated)
# tests/integration/test_schema.py::test_table_exists PASSED (read-only)
```

**Deliverable:** All write-capable tests blocked from running against `tutorial_prod`

### Phase 2: Provision Test Database (Week 1-2)

**Goal:** Create isolated test database for Project AI

**Actions:**

1. ✅ **Create database in Neon:**
   - Database name: `project_ai_test` or `tutorial_test`
   - Same Neon project (same host, low latency)
   - Same region as `tutorial_prod`
   - Connection pooling enabled

2. ✅ **Run migrations:**
   ```bash
   # Update DATABASE_URL_TUTORIAL temporarily to point to new database
   export DATABASE_URL_TUTORIAL="postgresql://user:pass@host/project_ai_test?sslmode=require"
   
   # Run Drizzle migrations
   pnpm --filter @quiz/db-tutorial db:migrate
   
   # Verify schema
   psql $DATABASE_URL_TUTORIAL -c "\dt"
   ```

3. ✅ **Add test environment variable:**
   ```bash
   # .env.local (development)
   DATABASE_URL_TUTORIAL="postgresql://...tutorial_prod..."  # Production
   TEST_DATABASE_URL_TUTORIAL="postgresql://...project_ai_test..."  # Testing
   TEST_DB_ISOLATION_VERIFIED=true
   
   # CI/CD environment
   DATABASE_URL_TUTORIAL="postgresql://...project_ai_test..."  # Use test DB in CI
   TEST_DB_ISOLATION_VERIFIED=true
   ```

4. ✅ **Update integration conftest:**
   ```python
   def _get_test_db_url() -> str | None:
       # Prefer TEST_DATABASE_URL_TUTORIAL if set
       return (os.environ.get("TEST_DATABASE_URL_TUTORIAL") or 
               os.environ.get("DATABASE_URL_TUTORIAL"))
   ```

5. ✅ **Implement database reset script:**
   ```python
   # scripts/reset_test_database.py
   async def reset_test_database():
       """Reset test database to clean state."""
       db_url = os.environ.get("TEST_DATABASE_URL_TUTORIAL")
       if not db_url or "prod" in db_url.lower():
           raise ValueError("Cannot reset production database")
       
       engine = create_async_engine(db_url)
       async with engine.begin() as conn:
           # Truncate all project_ai_* tables
           await conn.execute(text("""
               TRUNCATE TABLE 
                   project_ai_workflows,
                   project_ai_state_transitions,
                   project_ai_contracts,
                   project_ai_candidates,
                   project_ai_manifests,
                   project_ai_approvals
               CASCADE
           """))
       await engine.dispose()
   ```

**Verification:**

```bash
# Verify test database isolation
psql $TEST_DATABASE_URL_TUTORIAL -c "SELECT current_database()"
# Expected: project_ai_test

# Verify schema exists
psql $TEST_DATABASE_URL_TUTORIAL -c "\dt project_ai_*"
# Expected: List of 6 project_ai_* tables

# Verify no production data
psql $TEST_DATABASE_URL_TUTORIAL -c "SELECT COUNT(*) FROM project_ai_workflows"
# Expected: 0 (or test data only)
```

**Deliverable:** Isolated test database ready for integration tests

### Phase 3: Implement SAVEPOINT Rollback (Week 2)

**Goal:** Enable per-test transaction rollback

**Actions:**

1. ✅ **Update db_session fixture in integration conftest:**
   ```python
   @pytest_asyncio.fixture
   async def db_session(integration_db_engine):
       """
       Create an async database session with SAVEPOINT-based rollback.
       
       All operations (including commits) occur within a SAVEPOINT transaction
       that rolls back at test completion. This ensures test isolation.
       """
       async_session_factory = async_sessionmaker(
           integration_db_engine,
           class_=AsyncSession,
           expire_on_commit=False,
       )
       
       async with async_session_factory() as session:
           # Begin outer transaction
           async with session.begin():
               # Create savepoint for nested transactions
               savepoint = await session.begin_nested()
               
               yield session
               
               # Always rollback to savepoint (discards all test changes)
               await savepoint.rollback()
   ```

2. ✅ **Update db_session_factory fixture:**
   ```python
   @pytest_asyncio.fixture
   async def db_session_factory(integration_db_engine):
       """
       Provide session factory for restart simulation tests.
       
       Uses outer transaction that rolls back at test completion.
       """
       async_session_factory = async_sessionmaker(
           integration_db_engine,
           class_=AsyncSession,
           expire_on_commit=False,
       )
       
       async with async_session_factory() as outer_session:
           async with outer_session.begin():
               async def _factory():
                   return outer_session
               yield _factory
               await outer_session.rollback()
   ```

3. ✅ **Test the rollback behavior:**
   ```python
   @pytest.mark.integration
   @pytest.mark.db_write
   @pytest.mark.asyncio
   async def test_savepoint_rollback(db_session, workflow_repo):
       """Verify that committed data rolls back at test end."""
       workflow = WorkflowModel(id=uuid.uuid4(), ...)
       await workflow_repo.upsert(workflow)
       await db_session.commit()  # Commits to savepoint, not database
       
       # Verify data exists in this transaction
       result = await workflow_repo.get_by_id(workflow.id)
       assert result is not None
       
       # After test completes, savepoint rolls back
       # Data should NOT persist in database
   ```

4. ✅ **Verify rollback in separate test:**
   ```python
   @pytest.mark.integration
   @pytest.mark.db_write
   @pytest.mark.asyncio
   async def test_previous_test_data_not_visible(db_session):
       """Verify previous test's committed data was rolled back."""
       # This test runs AFTER test_savepoint_rollback
       # The workflow from previous test should NOT be visible
       result = await db_session.execute(
           text("SELECT COUNT(*) FROM project_ai_workflows")
       )
       count = result.scalar()
       # Expect 0 if rollback worked, >0 if data persisted
       assert count == 0, "Previous test data was not rolled back!"
   ```

**Verification:**

```bash
# Run test suite
pytest tests/integration/ -v

# Check database after tests complete
psql $TEST_DATABASE_URL_TUTORIAL -c "SELECT COUNT(*) FROM project_ai_workflows"
# Expected: 0 (all test data rolled back)
```

**Deliverable:** Per-test transaction rollback working correctly

### Phase 4: Enable Write Tests (Week 2-3)

**Goal:** Run full integration test suite against isolated database

**Actions:**

1. ✅ **Remove skip enforcement for isolated database:**
   ```python
   def pytest_collection_modifyitems(config, items):
       db_url = _get_test_db_url()
       if not db_url:
           # Skip if no database configured
           for item in items:
               if item.get_closest_marker("integration"):
                   item.add_marker(pytest.mark.skip(reason="DATABASE_URL_TUTORIAL not configured"))
           return
       
       is_isolated = _verify_database_isolation(db_url)
       if not is_isolated:
           # Skip write tests if not isolated
           for item in items:
               if item.get_closest_marker("db_write"):
                   item.add_marker(pytest.mark.skip(reason="Database not isolated"))
       # If isolated, all tests can run
   ```

2. ✅ **Run full test suite:**
   ```bash
   # Set test database
   export TEST_DATABASE_URL_TUTORIAL="postgresql://...project_ai_test..."
   export TEST_DB_ISOLATION_VERIFIED=true
   
   # Run all integration tests
   pytest tests/integration/ -v
   
   # Expected: All 103 integration tests should run and pass
   ```

3. ✅ **Verify test isolation:**
   ```bash
   # Run tests multiple times to verify independence
   pytest tests/integration/ --count=3
   
   # Check for flaky tests (order-dependent failures)
   pytest tests/integration/ --random-order
   ```

4. ✅ **Add to CI/CD:**
   ```yaml
   # .github/workflows/test.yml
   jobs:
     integration-tests:
       runs-on: ubuntu-latest
       env:
         DATABASE_URL_TUTORIAL: ${{ secrets.TEST_DATABASE_URL_TUTORIAL }}
         TEST_DB_ISOLATION_VERIFIED: true
       steps:
         - name: Reset test database
           run: python scripts/reset_test_database.py
         
         - name: Run integration tests
           run: pytest tests/integration/ -v
   ```

**Verification:**

```bash
# All tests pass
pytest tests/integration/ -v
# Expected: 103 passed

# Database is clean after tests
psql $TEST_DATABASE_URL_TUTORIAL -c "SELECT COUNT(*) FROM project_ai_workflows"
# Expected: 0

# Tests are isolated (can run multiple times)
pytest tests/integration/ --count=5
# Expected: All pass, no interference
```

**Deliverable:** Full integration test suite running against isolated PostgreSQL database

### Phase 5: Documentation and Maintenance (Week 3)

**Goal:** Document testing strategy and maintenance procedures

**Actions:**

1. ✅ **Update README:**
   ```markdown
   ## Testing
   
   ### Unit Tests (SQLite)
   
   Fast, isolated tests using SQLite in-memory database.
   
   ```bash
   pytest tests/ -m "not integration"
   ```
   
   ### Integration Tests (PostgreSQL)
   
   Integration tests require a PostgreSQL database.
   
   **Local Development:**
   ```bash
   # Set test database URL in .env.local
   TEST_DATABASE_URL_TUTORIAL="postgresql://user:pass@host/project_ai_test"
   TEST_DB_ISOLATION_VERIFIED=true
   
   # Run integration tests
   pytest tests/integration/
   ```
   
   **Safety:** Integration tests will NOT run against `tutorial_prod` or any database 
   containing "prod" in the name unless `TEST_DB_ISOLATION_VERIFIED=true` is set.
   
   ### Database Safety Policy
   
   - ✅ Unit tests always use SQLite in-memory (no PostgreSQL required)
   - ✅ Integration tests require isolated test database
   - ❌ Integration tests will NOT run against production databases
   - ✅ All test changes roll back automatically (SAVEPOINT-based)
   - ✅ Test database can be reset: `python scripts/reset_test_database.py`
   ```

2. ✅ **Create testing guide:**
   ```markdown
   # Integration Testing Guide
   
   ## Marker Usage
   
   ### @pytest.mark.db_read
   Read-only tests (SELECT only). Safe for any database.
   
   ### @pytest.mark.db_write
   Write tests (INSERT/UPDATE/DELETE). Requires isolated test database.
   
   ### @pytest.mark.requires_isolated_db
   Tests that must run against isolated database.
   
   ## Database Fixtures
   
   ### db_session
   Standard async session with SAVEPOINT rollback.
   All changes (including commits) roll back at test end.
   
   ### readonly_db_session
   Read-only session. Blocks all writes at PostgreSQL level.
   Safe for schema verification against any database.
   
   ### db_session_factory
   Factory for restart simulation tests.
   Creates multiple sessions in outer transaction that rolls back at test end.
   
   ## Writing New Tests
   
   ### Read-Only Test
   ```python
   @pytest.mark.integration
   @pytest.mark.db_read
   @pytest.mark.asyncio
   async def test_schema_verification(readonly_db_session):
       result = await readonly_db_session.execute(
           text("SELECT COUNT(*) FROM project_ai_workflows")
       )
       assert result.scalar() >= 0
   ```
   
   ### Write Test
   ```python
   @pytest.mark.integration
   @pytest.mark.db_write
   @pytest.mark.requires_isolated_db
   @pytest.mark.asyncio
   async def test_workflow_crud(db_session, workflow_repo):
       workflow = WorkflowModel(id=uuid.uuid4(), ...)
       await workflow_repo.upsert(workflow)
       await db_session.commit()
       
       result = await workflow_repo.get_by_id(workflow.id)
       assert result is not None
       
       # Cleanup automatic (SAVEPOINT rollback)
   ```
   ```

3. ✅ **Create maintenance procedures:**
   ```markdown
   # Test Database Maintenance
   
   ## Daily Maintenance
   
   None required. SAVEPOINT rollback ensures clean state after each test.
   
   ## Weekly Maintenance
   
   Verify test database schema matches production:
   
   ```bash
   # Dump production schema
   pg_dump -s $DATABASE_URL_TUTORIAL > prod_schema.sql
   
   # Dump test schema
   pg_dump -s $TEST_DATABASE_URL_TUTORIAL > test_schema.sql
   
   # Compare
   diff prod_schema.sql test_schema.sql
   ```
   
   ## Monthly Maintenance
   
   Reset test database to ensure clean state:
   
   ```bash
   # Option 1: Truncate tables (fast)
   python scripts/reset_test_database.py
   
   # Option 2: Drop and recreate (complete reset)
   dropdb project_ai_test
   createdb project_ai_test
   pnpm --filter @quiz/db-tutorial db:migrate --database=project_ai_test
   ```
   
   ## Migration Updates
   
   When Drizzle migrations are added:
   
   1. Run migration against production
   2. Run same migration against test database
   3. Verify schema compatibility
   4. Run integration tests to verify
   ```

4. ✅ **Create troubleshooting guide:**
   ```markdown
   # Integration Test Troubleshooting
   
   ## Tests Skipped: "DATABASE_URL_TUTORIAL not configured"
   
   **Cause:** Environment variable not set.
   
   **Solution:**
   ```bash
   # .env.local
   TEST_DATABASE_URL_TUTORIAL="postgresql://user:pass@host/project_ai_test"
   TEST_DB_ISOLATION_VERIFIED=true
   ```
   
   ## Tests Skipped: "Database not verified as isolated"
   
   **Cause:** Database name contains "prod" or is in blocklist.
   
   **Solution:**
   - Use dedicated test database named `*_test` or `*_dev`
   - Set `TEST_DB_ISOLATION_VERIFIED=true` if database is confirmed safe
   
   ## Flaky Tests: "Record already exists"
   
   **Cause:** Test data not rolling back properly.
   
   **Solution:**
   - Verify SAVEPOINT rollback is working: check `db_session` fixture
   - Reset test database: `python scripts/reset_test_database.py`
   - Check for commits outside session scope
   
   ## Connection Errors: "SSL required"
   
   **Cause:** asyncpg requires SSL for Neon connections.
   
   **Solution:** Connection string must include `sslmode=require` (automatically handled by conftest)
   
   ## Performance: Tests slow
   
   **Cause:** Network latency or connection pool exhaustion.
   
   **Solution:**
   - Verify test database on same host as production
   - Increase pool size: `pool_size=10, max_overflow=20`
   - Run tests sequentially: `pytest -n 1`
   ```

**Deliverable:** Complete documentation for testing strategy

---

## Summary of Recommendations

### Immediate Actions (CRITICAL)

1. ✅ **BLOCK write tests against `tutorial_prod`** — Add marker enforcement to prevent accidental writes
2. ✅ **Provision isolated test database** — Create `project_ai_test` or `tutorial_test` in Neon
3. ✅ **Add read-only fixture** — Enable safe schema verification against any database
4. ✅ **Tag all integration tests** — Add `@pytest.mark.db_read` or `@pytest.mark.db_write` markers

### Short-Term Actions (Week 1-2)

5. ✅ **Run migrations in test database** — Apply Project AI schema to isolated database
6. ✅ **Implement SAVEPOINT rollback** — Update `db_session` fixture for per-test isolation
7. ✅ **Update test configuration** — Use `TEST_DATABASE_URL_TUTORIAL` environment variable
8. ✅ **Create database reset script** — Implement cleanup procedure for test database

### Medium-Term Actions (Week 2-3)

9. ✅ **Enable full integration test suite** — Run all 103 tests against isolated database
10. ✅ **Add CI/CD integration** — Run integration tests in continuous integration
11. ✅ **Document testing strategy** — Update README and create testing guide
12. ✅ **Create maintenance procedures** — Document daily/weekly/monthly maintenance tasks

### Long-Term Actions (Month 1+)

13. ✅ **Monitor test performance** — Track test execution time and database resource usage
14. ✅ **Expand test coverage** — Add new integration tests as features are developed
15. ✅ **Periodic schema verification** — Ensure test database schema matches production
16. ✅ **Review database safety policy** — Update as requirements evolve

---

## Conclusion

**Current Risk:** 🔴 **CRITICAL** — Integration tests writing to shared production database

**Recommended Approach:** Dedicated test database with SAVEPOINT-based transaction rollback

**Timeline:**
- **Immediate (Today):** Block write tests from running
- **Week 1:** Provision isolated test database
- **Week 2:** Implement SAVEPOINT rollback and enable tests
- **Week 3:** Documentation and CI/CD integration

**Fallback:** If dedicated database unavailable, use extended SQLite approach (no PostgreSQL writes)

**Safety:** All proposed changes maintain or improve current safety posture. No changes increase risk.

**Next Steps:**
1. Review and approve this strategy
2. Provision `project_ai_test` database in Neon
3. Implement Phase 1 (marker enforcement) immediately
4. Proceed with Phase 2-5 as database becomes available

---

**Document Status:** ✅ Ready for Review and Approval
