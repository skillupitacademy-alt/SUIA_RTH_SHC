# Gate B-3: PostgreSQL Test Environment Specification

**Task:** Define isolated PostgreSQL test database requirements for project-ai service  
**Phase:** M2 Gate B — Project AI Canonical Wiring  
**Branch:** m2-project-ai-canonical-wiring  
**Authority:** Drizzle migrations (as specified in R3)

---

## Summary

This specification defines the isolated PostgreSQL test database environment for the project-ai service. The test environment must provide complete isolation from production, enforce safety assertions at bootstrap, and use the canonical Drizzle schema as the single source of truth. Tests use transaction rollback for isolation and explicit cleanup strategies to prevent test pollution.

---

## Functional Requirements

### FR-1: Test Database Identity

The test database must have a distinct identity preventing accidental production connections:

- **Database Name:** `project_ai_test` (MUST contain 'test', case-insensitive)
- **User:** `project_ai_test` (dedicated test user, NOT production user)
- **Host:** `127.0.0.1:55432` (non-standard port to prevent production conflicts)
- **Schema:** Canonical Drizzle migrations applied from `@quiz/db-tutorial`
- **Isolation:** tmpfs/ephemeral storage (Docker) or explicit test label (Neon)

### FR-2: Environment Variable Contract

The test environment MUST be configured via dedicated test environment variables:

```bash
# PostgreSQL Test Database (AsyncPG driver for SQLAlchemy async)
TEST_DATABASE_URL_TUTORIAL=postgresql+asyncpg://project_ai_test:<PASSWORD>@127.0.0.1:55432/project_ai_test

# JWT Secrets (test-only, minimum 32 characters)
JWT_SECRET=test_user_secret_key_at_least_32_characters_long_12345678
ADMIN_JWT_SECRET=test_admin_secret_key_at_least_32_characters_long_12345678
```

**Key Constraints:**
- `TEST_DATABASE_URL_TUTORIAL` is REQUIRED for integration tests
- NO fallback to `DATABASE_URL_TUTORIAL` (production)
- NO fallback to localhost guesses
- NO fallback to SQLite (PostgreSQL-only tests)
- Tests MUST skip with clear error if not configured

### FR-3: Safety Assertions

Test bootstrap MUST verify safety conditions before running tests:

1. **Database Name Validation:** Database name MUST contain 'test' (case-insensitive)
2. **Production Host Prevention:** MUST NOT connect to production hostnames (e.g., `*.neon.tech` production endpoints)
3. **Schema Verification:** `project_ai_workflows` table MUST exist (canary for migrations)
4. **Migration Currency:** Drizzle migrations MUST be up-to-date
5. **Limited Privileges:** Test user SHOULD have restricted permissions (no DROP DATABASE)

**Implementation Location:** `tests/integration/conftest.py`

### FR-4: Migration Strategy

**Authority:** Drizzle is the single source of truth for schema (R3 requirement)

**Migration Application:**
1. Run Drizzle migrations from `packages/db-tutorial` against test database
2. SQLAlchemy models in `app/persistence/models.py` MUST match Drizzle schema
3. NO SQLAlchemy metadata.create_all() in test fixtures (Drizzle-only)
4. Schema validation via canary table check (`project_ai_workflows`)

**Migration Command:**
```bash
# From workspace root
pnpm --filter @quiz/db-tutorial db:migrate
```

**Environment for Migration:**
```bash
# Use DIRECT URL to bypass pooler for DDL operations
DATABASE_DIRECT_URL_TUTORIAL=postgresql://project_ai_test:<PASSWORD>@127.0.0.1:55432/project_ai_test
```

### FR-5: Test Isolation Strategy

**Session Scope:**
- **Database Engine:** Session-scoped fixture (shared across all tests for performance)
- **Connection Pool:** Reused across tests with `pool_pre_ping=True`

**Function Scope:**
- **Transaction Rollback:** Each test runs in a transaction that rolls back automatically
- **Session Factory:** For restart simulation tests (outer transaction wrapper)

**Cleanup:**
- **Primary:** Transaction rollback (automatic, no manual cleanup needed)
- **Fallback:** Explicit table truncation (only if rollback fails)
- **CI:** Database recreation between test runs (Docker container restart)

### FR-6: Fixture Lifecycle

**Session-Scoped Fixtures:**
```python
@pytest_asyncio.fixture(scope="session")
async def integration_db_engine():
    """
    PostgreSQL engine for integration tests.
    - Verify TEST_DATABASE_URL_TUTORIAL configured
    - Check schema exists (project_ai_workflows table)
    - Dispose at session end
    """
```

**Function-Scoped Fixtures:**
```python
@pytest_asyncio.fixture
async def db_session(integration_db_engine):
    """
    Async session with transaction rollback.
    - New session per test
    - Automatic rollback on test completion
    """

@pytest_asyncio.fixture
async def db_session_factory(integration_db_engine):
    """
    Session factory for restart simulation tests.
    - Outer transaction wrapper for test-level isolation
    - Multiple "sessions" within same transaction
    - Rollback at test end
    """
```

**Repository Fixtures:**
```python
@pytest_asyncio.fixture
async def workflow_repo(db_session):
    return PostgresWorkflowRepository(db_session)

# Similar for: contract_repo, candidate_repo, manifest_repo, 
# approval_repo, state_transition_repo
```

### FR-7: Test Data Management

**Deterministic Fixtures:**
- Use known IDs (e.g., `workflow_id="wf-test-001"`)
- Predictable timestamps (e.g., `NOW() - INTERVAL '1 hour'`)
- Known user identities (`user_id="test-user-123"`)

**Test Data Characteristics:**
- Self-contained (no dependencies on external data)
- Repeatable (same input produces same output)
- Isolated (tests don't share mutable state)

---

## Non-Functional Requirements

### NFR-1: Performance

- Test database setup: < 5 seconds
- Individual test execution: < 500ms (95th percentile)
- Full integration test suite: < 60 seconds

### NFR-2: Safety

- Zero risk of production data modification
- Explicit fail-fast on misconfiguration
- Clear error messages for missing configuration

### NFR-3: Developer Experience

- Single environment variable to enable tests
- Automatic skip with helpful message when not configured
- Docker Compose one-liner for local setup

---

## Acceptance Criteria

### AC-1: Docker Compose Configuration

A `docker-compose.test.yml` file exists at `services/project-ai/docker-compose.test.yml` with:
- PostgreSQL 17 container
- Non-standard port 55432
- Ephemeral storage (tmpfs for speed)
- Test database and user auto-created
- Healthcheck configured

### AC-2: Environment Variable Template

A `.env.test.example` file exists at `services/project-ai/.env.test.example` with:
- `TEST_DATABASE_URL_TUTORIAL` with localhost:55432
- `JWT_SECRET` and `ADMIN_JWT_SECRET` (test values)
- Explanatory comments for each variable

### AC-3: Safety Assertions Implemented

Test bootstrap code in `tests/integration/conftest.py` that:
- Verifies database name contains 'test'
- Prevents production host connections
- Checks for `project_ai_workflows` table existence
- Skips tests with clear message if checks fail

### AC-4: Migration Application Documented

README section at `services/project-ai/README.md` that documents:
- How to start test database (Docker command)
- How to apply migrations (pnpm command)
- How to set environment variables
- How to run integration tests

### AC-5: CI Configuration Example

GitHub Actions workflow snippet in specification that shows:
- PostgreSQL service container configuration
- Migration application step
- Environment variable setup
- Test execution command

### AC-6: Fixture Patterns Validated

Integration tests in `tests/integration/` that demonstrate:
- Transaction rollback isolation (no cleanup needed)
- Restart simulation (session factory usage)
- Repository fixture usage
- Deterministic test data

### AC-7: Production Prevention Verified

Test that explicitly verifies:
- Cannot connect with production DATABASE_URL_TUTORIAL
- Cannot connect to production hostname
- Database name without 'test' rejected

---

## Docker Compose Configuration

**File:** `services/project-ai/docker-compose.test.yml`

```yaml
name: project-ai-test

services:
  postgres-test:
    image: postgres:17-alpine
    container_name: project-ai-test-db
    environment:
      POSTGRES_DB: project_ai_test
      POSTGRES_USER: project_ai_test
      POSTGRES_PASSWORD: test_password_123
      PGDATA: /var/lib/postgresql/data/pgdata
    ports:
      - "55432:5432"  # Non-standard port to prevent production conflicts
    tmpfs:
      # Ephemeral storage for speed and automatic cleanup
      - /var/lib/postgresql/data:rw,noexec,nosuid,size=512m
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U project_ai_test -d project_ai_test"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s
    restart: no  # No restart for test containers
    security_opt:
      - no-new-privileges:true

# No networks needed for local test database
```

**Usage:**
```bash
# Start test database
docker-compose -f services/project-ai/docker-compose.test.yml up -d

# Wait for healthy
docker-compose -f services/project-ai/docker-compose.test.yml ps

# Stop and remove (automatic data cleanup via tmpfs)
docker-compose -f services/project-ai/docker-compose.test.yml down
```

---

## Environment Variable Configuration

**File:** `services/project-ai/.env.test.example`

```bash
# ============================================================================
# PROJECT-AI TEST ENVIRONMENT CONFIGURATION
# ============================================================================
# This file contains TEST-ONLY configuration values.
# DO NOT use production secrets or production database URLs.
#
# Setup Instructions:
#   1. Copy this file to .env.test: cp .env.test.example .env.test
#   2. Start test database: docker-compose -f docker-compose.test.yml up -d
#   3. Apply migrations: pnpm --filter @quiz/db-tutorial db:migrate
#   4. Run tests: pytest tests/integration/ -v
# ============================================================================

# -----------------------------------------------------------------------------
# Test PostgreSQL Database (AsyncPG driver for SQLAlchemy async operations)
# -----------------------------------------------------------------------------
# CRITICAL: This MUST point to a TEST database on a non-standard port.
# The database name MUST contain 'test' (case-insensitive).
# Host MUST be localhost or 127.0.0.1 (NOT production hostname).
# -----------------------------------------------------------------------------
TEST_DATABASE_URL_TUTORIAL=postgresql+asyncpg://project_ai_test:test_password_123@127.0.0.1:55432/project_ai_test

# -----------------------------------------------------------------------------
# Migration Database URL (Direct connection, bypasses pooler for DDL)
# -----------------------------------------------------------------------------
# Used by Drizzle migrations. Same as TEST_DATABASE_URL_TUTORIAL but without
# the +asyncpg driver suffix (Drizzle uses standard PostgreSQL driver).
# -----------------------------------------------------------------------------
DATABASE_DIRECT_URL_TUTORIAL=postgresql://project_ai_test:test_password_123@127.0.0.1:55432/project_ai_test

# -----------------------------------------------------------------------------
# JWT Secrets (TEST-ONLY, minimum 32 characters)
# -----------------------------------------------------------------------------
# User token secret (used by most services)
JWT_SECRET=test_user_secret_key_at_least_32_characters_long_12345678

# Admin token secret (used for elevated privileges)
ADMIN_JWT_SECRET=test_admin_secret_key_at_least_32_characters_long_12345678

# JWT Configuration (optional overrides)
JWT_ALGORITHM=HS256
JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30

# -----------------------------------------------------------------------------
# Test Execution Notes
# -----------------------------------------------------------------------------
# - Integration tests skip gracefully if TEST_DATABASE_URL_TUTORIAL not set
# - Schema must be migrated before tests run (project_ai_workflows table check)
# - Each test runs in a transaction that rolls back automatically
# - No manual cleanup needed (transaction isolation handles it)
# -----------------------------------------------------------------------------
```

---

## Safety Assertion Implementation

**Location:** `tests/integration/conftest.py`

**Code Pattern:**

```python
"""
PostgreSQL Integration Test Configuration for project-ai service.

CRITICAL SAFETY REQUIREMENTS:
1. Tests REQUIRE TEST_DATABASE_URL_TUTORIAL environment variable
2. NO fallback to production DATABASE_URL_TUTORIAL
3. NO fallback to localhost guesses
4. NO SQLite substitution
5. Database name MUST contain 'test' (case-insensitive)

If safety checks fail, tests skip with clear error message.
"""

import os
import re
import pytest
import pytest_asyncio
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from urllib.parse import urlparse

# Check for test database configuration
TEST_DB_URL = os.environ.get("TEST_DATABASE_URL_TUTORIAL")

def pytest_collection_modifyitems(config, items):
    """Skip all integration tests if TEST_DATABASE_URL_TUTORIAL not configured."""
    if not TEST_DB_URL:
        skip_marker = pytest.mark.skip(
            reason="TEST_DATABASE_URL_TUTORIAL not configured — cannot run PostgreSQL integration tests"
        )
        for item in items:
            item.add_marker(skip_marker)


def _validate_test_database_url(url: str) -> tuple[bool, str]:
    """
    Validate that database URL is safe for testing.
    
    Returns: (is_valid, error_message)
    """
    try:
        parsed = urlparse(url)
        
        # Extract database name from path
        db_name = parsed.path.lstrip('/')
        
        # Safety Check 1: Database name MUST contain 'test'
        if 'test' not in db_name.lower():
            return False, f"Database name '{db_name}' does not contain 'test' (PRODUCTION PROTECTION)"
        
        # Safety Check 2: Must be localhost or 127.0.0.1
        if parsed.hostname not in ('localhost', '127.0.0.1'):
            return False, f"Database host '{parsed.hostname}' is not localhost (PRODUCTION PROTECTION)"
        
        # Safety Check 3: Should use non-standard port (warning only)
        if parsed.port == 5432:
            # Warning but not fatal (developer might use standard port locally)
            pass
        
        return True, ""
    
    except Exception as e:
        return False, f"Invalid database URL: {e}"


@pytest_asyncio.fixture(scope="session")
async def integration_db_engine():
    """
    Create PostgreSQL database engine for integration tests.
    
    Safety Assertions:
    1. TEST_DATABASE_URL_TUTORIAL must be configured
    2. Database name must contain 'test'
    3. Host must be localhost/127.0.0.1
    4. Schema must exist (project_ai_workflows table check)
    
    Scope: session (shared across all tests for performance)
    """
    if not TEST_DB_URL:
        pytest.skip("TEST_DATABASE_URL_TUTORIAL not configured")
    
    # Validate URL safety
    is_valid, error_msg = _validate_test_database_url(TEST_DB_URL)
    if not is_valid:
        pytest.skip(f"TEST_DATABASE_URL_TUTORIAL failed safety check: {error_msg}")
    
    # Create engine
    engine = create_async_engine(
        TEST_DB_URL,
        echo=False,  # Set to True for SQL debugging
        pool_pre_ping=True,  # Verify connections before using
        pool_size=5,
        max_overflow=10,
    )
    
    # Verify connectivity and schema exists
    try:
        async with engine.begin() as conn:
            # Safety Check 4: Verify migrations applied (canary table check)
            result = await conn.execute(
                """
                SELECT EXISTS (
                    SELECT FROM information_schema.tables 
                    WHERE table_name = 'project_ai_workflows'
                )
                """
            )
            table_exists = result.scalar()
            
            if not table_exists:
                await engine.dispose()
                pytest.skip(
                    "project_ai_workflows table does not exist in test database. "
                    "Run migrations before running integration tests: "
                    "pnpm --filter @quiz/db-tutorial db:migrate"
                )
    except Exception as e:
        await engine.dispose()
        pytest.skip(f"Failed to connect to test database: {e}")
    
    yield engine
    
    # Cleanup
    await engine.dispose()


@pytest_asyncio.fixture
async def db_session(integration_db_engine):
    """
    Create an async database session with transaction rollback for test isolation.
    
    Each test gets a fresh session within a transaction that is rolled back
    after the test completes, ensuring tests don't interfere with each other.
    
    Scope: function (new session per test)
    """
    async_session_factory = async_sessionmaker(
        integration_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    async with async_session_factory() as session:
        async with session.begin():
            yield session
            # Automatic rollback when context exits
            await session.rollback()


@pytest_asyncio.fixture
async def db_session_factory(integration_db_engine):
    """
    Provide a session factory for tests that need to simulate restarts.
    
    Returns a callable that creates new sessions, allowing tests to
    close one session and open another to simulate application restart.
    
    TRANSACTION ISOLATION:
    This fixture wraps all restart test operations in an outer transaction
    that automatically rolls back at test completion. Individual sessions
    created by the factory can commit their changes (making them visible
    to subsequent sessions in the same test), but all changes are rolled
    back when the test completes.
    """
    async_session_factory = async_sessionmaker(
        integration_db_engine,
        class_=AsyncSession,
        expire_on_commit=False,
    )
    
    # Start outer transaction for test-level isolation
    async with async_session_factory() as outer_session:
        async with outer_session.begin():
            async def _factory():
                """Return the outer session for all restart test operations."""
                return outer_session
            
            yield _factory
            
            # Rollback outer transaction at test end
            await outer_session.rollback()
```

---

## Migration Application Procedure

### Step 1: Start Test Database

```bash
# From workspace root
docker-compose -f services/project-ai/docker-compose.test.yml up -d

# Verify healthy
docker-compose -f services/project-ai/docker-compose.test.yml ps
# Should show "healthy" status
```

### Step 2: Configure Environment

```bash
# Copy example configuration
cp services/project-ai/.env.test.example services/project-ai/.env.test

# Verify configuration (optional)
cat services/project-ai/.env.test
```

### Step 3: Apply Migrations

```bash
# Apply canonical Drizzle migrations
pnpm --filter @quiz/db-tutorial db:migrate

# Verification query (optional)
docker exec -it project-ai-test-db psql -U project_ai_test -d project_ai_test \
  -c "SELECT table_name FROM information_schema.tables WHERE table_schema='public';"
```

**Expected Tables:**
- `project_ai_workflows`
- `project_ai_contracts`
- `project_ai_candidates`
- `project_ai_manifests`
- `project_ai_approvals`
- `project_ai_state_transitions`

### Step 4: Run Tests

```bash
# Run all integration tests
cd services/project-ai
pytest tests/integration/ -v

# Run specific test file
pytest tests/integration/test_repositories_integration.py -v

# Run with SQL logging (debugging)
pytest tests/integration/ -v -s  # SQLAlchemy echo must be True in conftest.py
```

---

## Cleanup Strategy

### Automatic Cleanup (Primary)

**Mechanism:** Transaction rollback

Each test runs within a transaction that automatically rolls back:

```python
async with session.begin():
    # Test operations here
    # ... create workflows, contracts, etc.
    yield session
    # Automatic rollback when context exits
    await session.rollback()
```

**Benefits:**
- Zero manual cleanup code needed
- Fast (no DELETE queries)
- Guaranteed isolation (changes never committed)
- Works for all operations (INSERT, UPDATE, DELETE)

### Manual Cleanup (Fallback)

**When Needed:** If transaction rollback fails (rare)

```python
@pytest_asyncio.fixture
async def cleanup_tables(integration_db_engine):
    """Explicit table truncation (fallback cleanup)."""
    yield
    
    # Cleanup after test (only if rollback fails)
    async with integration_db_engine.begin() as conn:
        await conn.execute("TRUNCATE TABLE project_ai_state_transitions CASCADE")
        await conn.execute("TRUNCATE TABLE project_ai_approvals CASCADE")
        await conn.execute("TRUNCATE TABLE project_ai_manifests CASCADE")
        await conn.execute("TRUNCATE TABLE project_ai_candidates CASCADE")
        await conn.execute("TRUNCATE TABLE project_ai_contracts CASCADE")
        await conn.execute("TRUNCATE TABLE project_ai_workflows CASCADE")
```

### CI Cleanup

**Docker Container Restart:**

```bash
# In CI pipeline - full database reset between runs
docker-compose -f docker-compose.test.yml down -v
docker-compose -f docker-compose.test.yml up -d
# Wait for healthy, apply migrations, run tests
```

**Neon Test Branch (Alternative):**

```bash
# Create ephemeral test branch
neon branches create --name "test-$GITHUB_RUN_ID" --project $NEON_PROJECT_ID

# Use branch URL for tests
TEST_DATABASE_URL_TUTORIAL="postgresql+asyncpg://...@...neon.tech/project_ai_test?options=project%3D$BRANCH_ID"

# Delete branch after tests
neon branches delete "test-$GITHUB_RUN_ID"
```

---

## GitHub Actions CI Configuration

**File:** `.github/workflows/project-ai-tests.yml`

```yaml
name: Project AI Integration Tests

on:
  push:
    branches: [ main, m2-project-ai-canonical-wiring ]
  pull_request:
    branches: [ main ]

jobs:
  integration-tests:
    runs-on: ubuntu-latest
    
    services:
      postgres:
        image: postgres:17-alpine
        env:
          POSTGRES_DB: project_ai_test
          POSTGRES_USER: project_ai_test
          POSTGRES_PASSWORD: test_password_123
        ports:
          - 5432:5432
        options: >-
          --health-cmd "pg_isready -U project_ai_test -d project_ai_test"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
          --tmpfs /var/lib/postgresql/data:rw,noexec,nosuid,size=512m
    
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      
      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      
      - name: Setup Python
        uses: actions/setup-python@v5
        with:
          python-version: '3.11'
          cache: 'pip'
      
      - name: Install pnpm
        run: npm install -g pnpm
      
      - name: Install dependencies
        run: |
          pnpm install
          cd services/project-ai && pip install -e ".[dev]"
      
      - name: Apply Drizzle migrations
        run: pnpm --filter @quiz/db-tutorial db:migrate
        env:
          # Use standard port in CI (service container uses 5432)
          DATABASE_DIRECT_URL_TUTORIAL: postgresql://project_ai_test:test_password_123@localhost:5432/project_ai_test
      
      - name: Run integration tests
        run: |
          cd services/project-ai
          pytest tests/integration/ -v --tb=short
        env:
          TEST_DATABASE_URL_TUTORIAL: postgresql+asyncpg://project_ai_test:test_password_123@localhost:5432/project_ai_test
          JWT_SECRET: test_user_secret_key_at_least_32_characters_long_12345678
          ADMIN_JWT_SECRET: test_admin_secret_key_at_least_32_characters_long_12345678
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v4
        with:
          name: pytest-results
          path: services/project-ai/pytest-results.xml
```

---

## Production Prevention Measures

### 1. Environment Variable Separation

**Test:** `TEST_DATABASE_URL_TUTORIAL`  
**Production:** `DATABASE_URL_TUTORIAL`

No overlap or fallback between them.

### 2. Database Name Validation

```python
if 'test' not in db_name.lower():
    raise ValueError(f"Database name '{db_name}' does not contain 'test'")
```

### 3. Hostname Whitelist

```python
ALLOWED_TEST_HOSTS = ('localhost', '127.0.0.1')
if parsed.hostname not in ALLOWED_TEST_HOSTS:
    raise ValueError(f"Host '{parsed.hostname}' not allowed for tests")
```

### 4. Port Isolation

Default test port: `55432` (non-standard)  
Production port: `5432` (standard)

### 5. Explicit Skip on Missing Config

```python
if not TEST_DB_URL:
    pytest.skip("TEST_DATABASE_URL_TUTORIAL not configured")
```

Never attempt connection without explicit configuration.

### 6. Read-Only Test User (Optional)

```sql
-- Create test user with limited privileges
CREATE USER project_ai_test WITH PASSWORD 'test_password_123';
GRANT CONNECT ON DATABASE project_ai_test TO project_ai_test;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO project_ai_test;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO project_ai_test;

-- Deny destructive operations
REVOKE DROP ON DATABASE project_ai_test FROM project_ai_test;
```

### 7. CI Environment Enforcement

```yaml
# In CI, production secrets are never exposed to test jobs
env:
  # Explicitly set test values (no secrets)
  TEST_DATABASE_URL_TUTORIAL: postgresql+asyncpg://project_ai_test:test_password_123@localhost:5432/project_ai_test
```

---

## Out of Scope

1. **SQLite Testing:** This specification is PostgreSQL-only. No SQLite fallback or compatibility layer.

2. **Production Data Migration:** This covers test data only. Production data migration is handled separately.

3. **Performance Testing Database:** Load testing and performance benchmarking require separate infrastructure.

4. **Cross-Database Compatibility:** This specification assumes PostgreSQL 17. Other databases (MySQL, SQLite) are not supported.

5. **Automated Migration Rollback:** Drizzle migration rollback is manual. Automated rollback in CI is out of scope.

6. **Test Data Fixtures Library:** While deterministic test data is required, a shared fixture library is not included in this specification.

7. **Database Monitoring:** Test database metrics and monitoring are not included.

---

## References

- **R3 Architecture:** `.agents/tasks/r3-architecture-correction.md` (Drizzle authority)
- **Existing Implementation:** `services/project-ai/tests/integration/conftest.py`
- **FEAT-004 Report:** `.agents/evidence/r3-feat-004-test-report.md`
- **Drizzle Config:** `packages/db-tutorial/drizzle.config.ts`
- **Gate D Plan:** `.agents/tasks/gate-d-plan.md` (broader test infrastructure)

---

## Revision History

| Date | Version | Changes |
|------|---------|---------|
| 2025-01-XX | 1.0 | Initial specification for Gate B-3 |

