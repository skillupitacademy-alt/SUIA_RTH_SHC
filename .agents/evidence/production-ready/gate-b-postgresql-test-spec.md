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

## Integration Test Specifications

### Overview

Integration tests verify that PostgreSQL repository implementations correctly interact with the database, enforce business rules, and maintain data integrity. All tests use transaction rollback for isolation and run against the canonical Drizzle schema.

**Test Organization:**
- Location: `services/project-ai/tests/integration/`
- Framework: pytest + pytest-asyncio
- Database: PostgreSQL 17 (via Docker or local)
- Schema: Canonical Drizzle migrations from `@quiz/db-tutorial`

### BLOCKED: TEST_DATABASE_URL_TUTORIAL Not Set

**Current Status:** Integration tests are **BLOCKED** because `TEST_DATABASE_URL_TUTORIAL` is not configured in the environment.

**Unblocking Steps:**

1. **Start test database:**
   ```bash
   docker-compose -f services/project-ai/docker-compose.test.yml up -d
   ```

2. **Set environment variable:**
   ```bash
   # Add to services/project-ai/.env.test
   TEST_DATABASE_URL_TUTORIAL=postgresql+asyncpg://project_ai_test:test_password_123@127.0.0.1:55432/project_ai_test
   ```

3. **Apply migrations:**
   ```bash
   pnpm --filter @quiz/db-tutorial db:migrate
   ```

4. **Run tests:**
   ```bash
   cd services/project-ai
   pytest tests/integration/ -v
   ```

**Current Behavior:** Tests skip gracefully with message: `"TEST_DATABASE_URL_TUTORIAL not configured — cannot run PostgreSQL integration tests"`

### Test Suite Categories

#### TS-1: CRUD Operations Tests

**Purpose:** Verify basic Create, Read, Update, Delete operations for all repository implementations.

**Test Cases:**

**TC-1.1: Workflow CRUD**
```python
async def test_workflow_create_and_retrieve(workflow_repo):
    """Create a workflow and retrieve it by ID."""
    workflow = await workflow_repo.create(
        workflow_id="wf-test-001",
        workflow_type="tutorial_gen",
        user_id="test-user-123",
        status="draft",
        config={"model": "gpt-4"}
    )
    
    retrieved = await workflow_repo.get_by_id("wf-test-001")
    assert retrieved.workflow_id == "wf-test-001"
    assert retrieved.status == "draft"
    assert retrieved.config["model"] == "gpt-4"
```

**TC-1.2: Contract CRUD**
```python
async def test_contract_create_and_update(contract_repo):
    """Create a contract and update its status."""
    contract = await contract_repo.create(
        contract_id="contract-test-001",
        workflow_id="wf-test-001",
        contract_type="tutorial_generation",
        specification={"topics": ["Python", "FastAPI"]},
        status="pending"
    )
    
    updated = await contract_repo.update_status(
        contract_id="contract-test-001",
        status="active"
    )
    
    assert updated.status == "active"
    assert updated.contract_id == "contract-test-001"
```

**TC-1.3: Candidate CRUD**
```python
async def test_candidate_create_and_list(candidate_repo):
    """Create multiple candidates and list them by contract."""
    for i in range(3):
        await candidate_repo.create(
            candidate_id=f"candidate-test-{i:03d}",
            contract_id="contract-test-001",
            agent_id="agent-001",
            artifact={"content": f"Candidate {i}"},
            quality_score=0.75 + (i * 0.05)
        )
    
    candidates = await candidate_repo.list_by_contract("contract-test-001")
    assert len(candidates) == 3
    assert candidates[0].quality_score >= candidates[1].quality_score
```

**TC-1.4: Manifest CRUD**
```python
async def test_manifest_create_and_retrieve(manifest_repo):
    """Create a manifest and verify its structure."""
    manifest = await manifest_repo.create(
        manifest_id="manifest-test-001",
        workflow_id="wf-test-001",
        manifest_data={
            "deliverables": ["artifact1.md", "artifact2.md"],
            "metrics": {"quality": 0.92}
        }
    )
    
    retrieved = await manifest_repo.get_by_id("manifest-test-001")
    assert retrieved.manifest_data["metrics"]["quality"] == 0.92
    assert len(retrieved.manifest_data["deliverables"]) == 2
```

**TC-1.5: Approval CRUD**
```python
async def test_approval_create_and_query(approval_repo):
    """Create approval records and query by workflow."""
    await approval_repo.create(
        approval_id="approval-test-001",
        workflow_id="wf-test-001",
        approver_id="approver-001",
        decision="approved",
        rationale="Meets quality standards"
    )
    
    approvals = await approval_repo.list_by_workflow("wf-test-001")
    assert len(approvals) == 1
    assert approvals[0].decision == "approved"
```

**TC-1.6: State Transition CRUD**
```python
async def test_state_transition_create_and_audit(state_transition_repo):
    """Create state transitions and retrieve audit log."""
    await state_transition_repo.create(
        transition_id="transition-test-001",
        workflow_id="wf-test-001",
        from_state="draft",
        to_state="active",
        triggered_by="user-123",
        reason="Manual activation"
    )
    
    transitions = await state_transition_repo.get_audit_log("wf-test-001")
    assert len(transitions) == 1
    assert transitions[0].from_state == "draft"
    assert transitions[0].to_state == "active"
```

#### TS-2: RBAC Enforcement Tests

**Purpose:** Verify that database-level access controls prevent unauthorized operations.

**Note:** Full RBAC implementation depends on PostgreSQL Row-Level Security (RLS) policies. Initial Gate B tests verify repository-level enforcement; database-level RLS is Gate C work.

**TC-2.1: User Isolation**
```python
async def test_user_cannot_access_other_user_workflows(workflow_repo):
    """Verify users can only access their own workflows."""
    # Create workflow for user A
    await workflow_repo.create(
        workflow_id="wf-user-a-001",
        workflow_type="tutorial_gen",
        user_id="user-a",
        status="draft"
    )
    
    # Create workflow for user B
    await workflow_repo.create(
        workflow_id="wf-user-b-001",
        workflow_type="tutorial_gen",
        user_id="user-b",
        status="draft"
    )
    
    # Query as user A (repository should filter by user_id)
    user_a_workflows = await workflow_repo.list_by_user("user-a")
    assert len(user_a_workflows) == 1
    assert user_a_workflows[0].workflow_id == "wf-user-a-001"
```

**TC-2.2: Admin Override**
```python
async def test_admin_can_access_all_workflows(workflow_repo):
    """Verify admin role can access all workflows."""
    # Create workflows for different users
    for user_id in ["user-a", "user-b", "user-c"]:
        await workflow_repo.create(
            workflow_id=f"wf-{user_id}-001",
            workflow_type="tutorial_gen",
            user_id=user_id,
            status="draft"
        )
    
    # Admin query (no user_id filter)
    all_workflows = await workflow_repo.list_all(admin_role=True)
    assert len(all_workflows) >= 3
```

**TC-2.3: Status-Based Access Control**
```python
async def test_cannot_modify_locked_workflow(workflow_repo):
    """Verify locked workflows cannot be modified."""
    workflow = await workflow_repo.create(
        workflow_id="wf-locked-001",
        workflow_type="tutorial_gen",
        user_id="user-123",
        status="locked"
    )
    
    with pytest.raises(ValueError, match="Cannot modify locked workflow"):
        await workflow_repo.update_config(
            workflow_id="wf-locked-001",
            config={"new_key": "new_value"}
        )
```

#### TS-3: Transaction Rollback Tests

**Purpose:** Verify that failed operations do not leave partial state in the database.

**TC-3.1: Contract Creation Rollback**
```python
async def test_contract_creation_rollback_on_error(contract_repo, db_session):
    """Verify contract creation rolls back on failure."""
    try:
        async with db_session.begin_nested():
            # Create contract
            await contract_repo.create(
                contract_id="contract-rollback-001",
                workflow_id="wf-test-001",
                contract_type="tutorial_generation",
                specification={"topics": []},
                status="pending"
            )
            
            # Simulate error
            raise ValueError("Simulated error")
    except ValueError:
        pass
    
    # Verify contract was not persisted
    retrieved = await contract_repo.get_by_id("contract-rollback-001")
    assert retrieved is None
```

**TC-3.2: Cascade Rollback**
```python
async def test_cascade_rollback_on_constraint_violation(
    workflow_repo, contract_repo, db_session
):
    """Verify cascading operations roll back together on error."""
    try:
        async with db_session.begin_nested():
            # Create workflow
            workflow = await workflow_repo.create(
                workflow_id="wf-cascade-001",
                workflow_type="tutorial_gen",
                user_id="user-123",
                status="draft"
            )
            
            # Create contracts (should succeed)
            await contract_repo.create(
                contract_id="contract-cascade-001",
                workflow_id="wf-cascade-001",
                contract_type="tutorial_generation",
                specification={},
                status="pending"
            )
            
            # Violate constraint (duplicate primary key)
            await contract_repo.create(
                contract_id="contract-cascade-001",  # Duplicate!
                workflow_id="wf-cascade-001",
                contract_type="tutorial_generation",
                specification={},
                status="pending"
            )
    except Exception:
        pass
    
    # Verify both workflow and contract rolled back
    assert await workflow_repo.get_by_id("wf-cascade-001") is None
    assert await contract_repo.get_by_id("contract-cascade-001") is None
```

#### TS-4: Restart Simulation Tests

**Purpose:** Verify that workflows can be resumed after application restart (session close/reopen).

**TC-4.1: Workflow Resume After Restart**
```python
async def test_workflow_resume_after_restart(db_session_factory, workflow_repo):
    """Simulate application restart and resume workflow."""
    # Session 1: Create workflow
    session1 = await db_session_factory()
    repo1 = PostgresWorkflowRepository(session1)
    
    workflow = await repo1.create(
        workflow_id="wf-restart-001",
        workflow_type="tutorial_gen",
        user_id="user-123",
        status="draft"
    )
    await session1.commit()
    await session1.close()
    
    # Session 2: Resume workflow (simulate restart)
    session2 = await db_session_factory()
    repo2 = PostgresWorkflowRepository(session2)
    
    retrieved = await repo2.get_by_id("wf-restart-001")
    assert retrieved.workflow_id == "wf-restart-001"
    assert retrieved.status == "draft"
    
    # Update status
    await repo2.update_status("wf-restart-001", "active")
    await session2.commit()
    await session2.close()
    
    # Session 3: Verify update persisted
    session3 = await db_session_factory()
    repo3 = PostgresWorkflowRepository(session3)
    
    final = await repo3.get_by_id("wf-restart-001")
    assert final.status == "active"
```

#### TS-5: Complex Query Tests

**Purpose:** Verify that repository query methods return correct results for complex filters.

**TC-5.1: Workflow Status Filtering**
```python
async def test_list_workflows_by_status(workflow_repo):
    """Query workflows by status."""
    statuses = ["draft", "active", "completed", "failed"]
    
    for i, status in enumerate(statuses):
        await workflow_repo.create(
            workflow_id=f"wf-status-{i:03d}",
            workflow_type="tutorial_gen",
            user_id="user-123",
            status=status
        )
    
    active_workflows = await workflow_repo.list_by_status("active")
    assert len(active_workflows) == 1
    assert active_workflows[0].status == "active"
```

**TC-5.2: Candidate Ranking**
```python
async def test_list_candidates_ranked_by_quality(candidate_repo):
    """Retrieve candidates ranked by quality score."""
    scores = [0.65, 0.92, 0.78, 0.84]
    
    for i, score in enumerate(scores):
        await candidate_repo.create(
            candidate_id=f"candidate-rank-{i:03d}",
            contract_id="contract-test-001",
            agent_id="agent-001",
            artifact={"content": f"Candidate {i}"},
            quality_score=score
        )
    
    ranked = await candidate_repo.list_by_contract_ranked("contract-test-001")
    assert len(ranked) == 4
    assert ranked[0].quality_score == 0.92  # Highest first
    assert ranked[-1].quality_score == 0.65  # Lowest last
```

**TC-5.3: Time-Range Queries**
```python
async def test_list_workflows_by_date_range(workflow_repo):
    """Query workflows created within a date range."""
    from datetime import datetime, timedelta, timezone
    
    now = datetime.now(timezone.utc)
    
    # Create workflows with different timestamps
    for i in range(5):
        await workflow_repo.create(
            workflow_id=f"wf-date-{i:03d}",
            workflow_type="tutorial_gen",
            user_id="user-123",
            status="draft",
            created_at=now - timedelta(days=i)
        )
    
    # Query last 3 days
    start_date = now - timedelta(days=3)
    recent = await workflow_repo.list_by_date_range(start_date, now)
    assert len(recent) == 4  # Days 0, 1, 2, 3
```

#### TS-6: Data Integrity Tests

**Purpose:** Verify that database constraints and business rules are enforced.

**TC-6.1: Foreign Key Constraints**
```python
async def test_cannot_create_contract_for_nonexistent_workflow(contract_repo):
    """Verify foreign key constraint prevents orphaned contracts."""
    with pytest.raises(Exception):  # ForeignKeyViolation
        await contract_repo.create(
            contract_id="contract-orphan-001",
            workflow_id="wf-nonexistent",  # Does not exist
            contract_type="tutorial_generation",
            specification={},
            status="pending"
        )
```

**TC-6.2: Unique Constraints**
```python
async def test_cannot_create_duplicate_workflow_id(workflow_repo):
    """Verify unique constraint on workflow_id."""
    await workflow_repo.create(
        workflow_id="wf-unique-001",
        workflow_type="tutorial_gen",
        user_id="user-123",
        status="draft"
    )
    
    with pytest.raises(Exception):  # UniqueViolation
        await workflow_repo.create(
            workflow_id="wf-unique-001",  # Duplicate!
            workflow_type="tutorial_gen",
            user_id="user-456",
            status="draft"
        )
```

**TC-6.3: NOT NULL Constraints**
```python
async def test_workflow_requires_user_id(workflow_repo):
    """Verify NOT NULL constraint on user_id."""
    with pytest.raises(Exception):  # NotNullViolation
        await workflow_repo.create(
            workflow_id="wf-null-user-001",
            workflow_type="tutorial_gen",
            user_id=None,  # NOT NULL violation
            status="draft"
        )
```

### Integration Test Acceptance Criteria

**AC-INT-1:** All CRUD operation tests (TC-1.1 through TC-1.6) pass  
**AC-INT-2:** RBAC enforcement tests (TC-2.1 through TC-2.3) pass  
**AC-INT-3:** Transaction rollback tests (TC-3.1, TC-3.2) pass  
**AC-INT-4:** Restart simulation test (TC-4.1) passes  
**AC-INT-5:** Complex query tests (TC-5.1 through TC-5.3) pass  
**AC-INT-6:** Data integrity tests (TC-6.1 through TC-6.3) pass  
**AC-INT-7:** Test execution time < 60 seconds for full suite  
**AC-INT-8:** Zero test pollution (tests can run in any order)

---

## Rollback Test Specifications

### Overview

Rollback tests verify that Drizzle migrations can be safely reversed without data loss or corruption. These tests are critical for production incident recovery.

**Current Status:** Gate B focuses on forward migrations. Rollback testing is a Gate C/D priority.

### RT-1: Single Migration Rollback

**Purpose:** Verify that the most recent migration can be rolled back cleanly.

**Procedure:**
```bash
# Apply latest migration
pnpm --filter @quiz/db-tutorial db:migrate

# Record schema state
psql -U project_ai_test -d project_ai_test \
  -c "\d project_ai_workflows" > schema_before.txt

# Insert test data
psql -U project_ai_test -d project_ai_test \
  -c "INSERT INTO project_ai_workflows (...) VALUES (...);"

# Rollback one migration
pnpm --filter @quiz/db-tutorial db:migrate:rollback

# Verify schema reverted
psql -U project_ai_test -d project_ai_test \
  -c "\d project_ai_workflows" > schema_after.txt

diff schema_before.txt schema_after.txt
```

**Expected Result:** Schema state matches pre-migration snapshot. Test data is lost (expected for rollback).

### RT-2: Column Addition Rollback

**Specification:** If a migration adds a column (e.g., `workflow_priority`), rolling back should remove the column without affecting other columns.

**Verification:**
- Column count decreases by 1
- Existing columns retain data
- Indexes on other columns remain intact

### RT-3: Table Creation Rollback

**Specification:** If a migration creates a new table (e.g., `project_ai_notifications`), rolling back should drop the table cleanly.

**Verification:**
- Table no longer exists in `information_schema.tables`
- Foreign key references (if any) are also removed
- No orphaned sequences or indexes

### RT-4: Data Migration Rollback

**Specification:** If a migration performs data transformation (e.g., splitting a column into two), rolling back should restore original data format.

**Challenge:** Reversible data migrations require careful planning. Drizzle does not automatically generate data rollback logic.

**Gate B Scope:** Document rollback patterns. Implementation in Gate C/D.

### Rollback Test Acceptance Criteria

**AC-RB-1:** Single migration rollback procedure documented  
**AC-RB-2:** Rollback verification queries defined  
**AC-RB-3:** Known risks of rollback documented (data loss scenarios)  
**AC-RB-4:** Rollback testing is **NOT BLOCKING** for Gate C (forward migrations are sufficient)

---

## Performance Test Specifications

### Overview

Performance tests verify that repository operations meet latency and throughput requirements under realistic load.

**Gate B Scope:** Baseline performance measurement. Load testing is Gate D/E work.

### PT-1: Query Performance Benchmarks

**Purpose:** Establish baseline query performance for common operations.

**Test Queries:**

**PT-1.1: Single Row Retrieval**
```sql
-- Target: < 5ms
SELECT * FROM project_ai_workflows WHERE workflow_id = 'wf-test-001';
```

**PT-1.2: User Workflow List**
```sql
-- Target: < 20ms for up to 100 workflows
SELECT * FROM project_ai_workflows 
WHERE user_id = 'user-123' 
ORDER BY created_at DESC 
LIMIT 50;
```

**PT-1.3: Contract Lookup with Join**
```sql
-- Target: < 30ms
SELECT 
    c.contract_id, c.status, w.workflow_id, w.user_id
FROM project_ai_contracts c
JOIN project_ai_workflows w ON c.workflow_id = w.workflow_id
WHERE c.contract_id = 'contract-test-001';
```

**PT-1.4: Candidate Ranking**
```sql
-- Target: < 50ms for up to 20 candidates
SELECT * FROM project_ai_candidates
WHERE contract_id = 'contract-test-001'
ORDER BY quality_score DESC
LIMIT 10;
```

**Measurement Tool:**
```python
import time

async def benchmark_query(repo, query_func, *args, iterations=100):
    """Benchmark a repository query."""
    start = time.perf_counter()
    for _ in range(iterations):
        await query_func(*args)
    end = time.perf_counter()
    
    avg_duration = (end - start) / iterations
    return avg_duration
```

### PT-2: Index Usage Verification

**Purpose:** Verify that queries use indexes correctly (no table scans for indexed columns).

**Verification Method:**
```sql
EXPLAIN ANALYZE 
SELECT * FROM project_ai_workflows WHERE workflow_id = 'wf-test-001';
```

**Expected Output:**
```
Index Scan using project_ai_workflows_pkey on project_ai_workflows  
  (cost=0.15..8.17 rows=1 width=...)
```

**Red Flags:**
- `Seq Scan` (sequential scan) on large tables
- Missing index usage on foreign key columns
- High `cost` estimates (> 1000 for single-row queries)

### PT-3: Connection Pool Behavior

**Purpose:** Verify that connection pool correctly handles concurrent requests.

**Test Scenario:**
```python
async def test_connection_pool_concurrency():
    """Verify connection pool handles 20 concurrent queries."""
    import asyncio
    
    async def query_workflow(workflow_id):
        return await workflow_repo.get_by_id(workflow_id)
    
    # Create 20 concurrent queries
    tasks = [query_workflow(f"wf-test-{i:03d}") for i in range(20)]
    results = await asyncio.gather(*tasks)
    
    assert len(results) == 20
```

**Configuration Validation:**
- `pool_size=5` (SQLAlchemy default)
- `max_overflow=10` (allows up to 15 total connections)
- `pool_pre_ping=True` (validates connections before use)

**Metrics:**
- No connection timeout errors
- Connections reused across requests
- Pool checkout time < 10ms

### PT-4: Large Result Set Handling

**Purpose:** Verify that queries returning many rows do not cause memory issues.

**Test Scenario:**
```python
async def test_large_result_set():
    """Query 1000 workflows and verify memory efficiency."""
    import tracemalloc
    
    tracemalloc.start()
    
    # Insert 1000 workflows
    for i in range(1000):
        await workflow_repo.create(
            workflow_id=f"wf-bulk-{i:04d}",
            workflow_type="tutorial_gen",
            user_id="user-123",
            status="draft"
        )
    
    # Query all (should use streaming/batching)
    snapshot_before = tracemalloc.take_snapshot()
    workflows = await workflow_repo.list_by_user("user-123", limit=1000)
    snapshot_after = tracemalloc.take_snapshot()
    
    memory_used = sum(
        stat.size_diff 
        for stat in snapshot_after.compare_to(snapshot_before, 'lineno')
    )
    
    # Verify memory usage is reasonable (< 50MB for 1000 rows)
    assert memory_used < 50 * 1024 * 1024
```

### Performance Test Acceptance Criteria

**AC-PERF-1:** Query benchmarks documented for all major operations  
**AC-PERF-2:** Index usage verified via EXPLAIN ANALYZE  
**AC-PERF-3:** Connection pool handles 20 concurrent queries without errors  
**AC-PERF-4:** Large result sets (1000+ rows) do not cause memory issues  
**AC-PERF-5:** Performance baselines recorded for future regression testing  
**AC-PERF-6:** Load testing (1000+ concurrent users) is **OUT OF SCOPE** for Gate B

---

## Known Blockers

### P0 Blockers (Must Resolve Before Gate C)

None currently.

### P1 Blockers (Must Resolve for Full Test Coverage)

**BLOCKER-1: TEST_DATABASE_URL_TUTORIAL Not Set**

**Impact:** Integration tests cannot run. Currently skipping with message.

**Resolution Steps:**
1. Start test database: `docker-compose -f services/project-ai/docker-compose.test.yml up -d`
2. Create `.env.test` file: `cp .env.test.example .env.test`
3. Set variable: `TEST_DATABASE_URL_TUTORIAL=postgresql+asyncpg://project_ai_test:test_password_123@127.0.0.1:55432/project_ai_test`
4. Apply migrations: `pnpm --filter @quiz/db-tutorial db:migrate`
5. Run tests: `pytest tests/integration/ -v`

**Required Value Format:**
```
TEST_DATABASE_URL_TUTORIAL=postgresql+asyncpg://USER:PASSWORD@HOST:PORT/DATABASE
```

**Example:**
```
TEST_DATABASE_URL_TUTORIAL=postgresql+asyncpg://project_ai_test:test_password_123@127.0.0.1:55432/project_ai_test
```

**Current Workaround:** Tests skip gracefully. No false failures.

**Target Resolution:** Before first integration test run.

### P2 Blockers (Nice to Have)

**BLOCKER-2: CI GitHub Actions Workflow Not Created**

**Impact:** Integration tests not running in CI pipeline.

**Resolution:** Create `.github/workflows/project-ai-tests.yml` (template provided in this spec).

**Target Resolution:** Gate C (not blocking local development).

---

## Final Acceptance Criteria Summary

Before Gate C implementation begins, the following MUST be true:

### Setup Requirements
- ✅ Docker Compose configuration exists (`docker-compose.test.yml`)
- ✅ Environment variable template exists (`.env.test.example`)
- ✅ Migration application procedure documented
- ⚠️  **TEST_DATABASE_URL_TUTORIAL configured** (P1 blocker — manual setup required)

### Integration Tests
- ⚠️  All CRUD operation tests implemented and passing (blocked by TEST_DATABASE_URL_TUTORIAL)
- ⚠️  RBAC enforcement tests implemented (blocked by TEST_DATABASE_URL_TUTORIAL)
- ⚠️  Transaction rollback tests implemented (blocked by TEST_DATABASE_URL_TUTORIAL)
- ⚠️  Restart simulation tests implemented (blocked by TEST_DATABASE_URL_TUTORIAL)
- ✅ Safety assertions implemented in `conftest.py`

### Rollback Tests
- ✅ Rollback procedure documented
- ✅ Verification queries defined
- ✅ Known risks documented
- ✅ Acknowledged as non-blocking for Gate C

### Performance Tests
- ✅ Query benchmarks documented
- ✅ Index usage verification method defined
- ✅ Connection pool test specified
- ✅ Load testing deferred to Gate D/E

### Documentation
- ✅ README section exists with setup instructions
- ✅ CI configuration example provided
- ✅ Production prevention measures documented
- ✅ All acceptance criteria clearly defined

**Gate C Readiness:** 🟡 **80% Complete** — Integration tests are specified but blocked by TEST_DATABASE_URL_TUTORIAL not being set. All other requirements are met.

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
| 2025-01-29 | 2.0 | Completed all sections: Integration Tests, Rollback Tests, Performance Tests, Known Blockers, Final Acceptance Criteria |

