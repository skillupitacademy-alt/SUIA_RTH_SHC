# Gate D — CI Configuration for PostgreSQL Integration Tests

## Overview

This document describes the GitHub Actions configuration for running PostgreSQL integration tests in CI pipelines. Integration tests validate RBAC, brand isolation, identity extraction, state machine, and W3/W5 workflow security contracts against a real PostgreSQL database.

## GitHub Actions Service Container

The CI pipeline uses GitHub Actions service containers to run PostgreSQL 17 alongside the test runner. This provides a clean, isolated database for each test run.

### Service Container Configuration

```yaml
services:
  postgres:
    image: postgres:17
    env:
      POSTGRES_DB: tutorial_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
      POSTGRES_HOST_AUTH_METHOD: trust
    ports:
      - 5432:5432
    options: >-
      --health-cmd "pg_isready -U test_user"
      --health-interval 5s
      --health-timeout 5s
      --health-retries 3
```

### Health Check

The `--health-cmd` option ensures the PostgreSQL service is ready before tests run:
- Command: `pg_isready -U test_user`
- Interval: 5 seconds
- Timeout: 5 seconds per check
- Retries: 3 attempts

GitHub Actions waits for the health check to pass before proceeding to test steps.

## Environment Variables

Integration tests require these environment variables:

### Database Connection
- **`TEST_DATABASE_URL_TUTORIAL`**: PostgreSQL connection URL
  - CI value: `postgresql+asyncpg://test_user:test_password@localhost:5432/tutorial_test`
  - Driver: `asyncpg` (async PostgreSQL driver for SQLAlchemy)
  - Host: `localhost` (service container accessible via localhost in CI)
  - Port: `5432` (CI uses standard port, no conflicts in clean container)

### JWT Configuration
- **`JWT_SECRET`**: User token signing secret (minimum 32 characters)
  - CI value: `test_jwt_secret_minimum_32_characters_long_value`
- **`ADMIN_JWT_SECRET`**: Admin token signing secret (minimum 32 characters)
  - CI value: `test_admin_jwt_secret_minimum_32_characters`

**Security Note:** These are test-only secrets. Never use production secrets in CI logs.

## Migration Prerequisite

**CRITICAL:** Drizzle migrations MUST run before pytest integration tests.

### Migration Step

```yaml
- name: Run Drizzle migrations
  env:
    DATABASE_URL: postgresql://test_user:test_password@localhost:5432/tutorial_test
  run: |
    cd packages/db-tutorial
    pnpm db:migrate
```

**Why?**
- Python application **never** creates schema (read-only ORM)
- Schema authority: Drizzle (TypeScript → SQL migrations)
- Integration tests expect `project_ai_*` tables to exist

**Validation:**
The test fixtures (`tests/integration/conftest.py`) validate schema existence:
```python
# Check if project_ai_workflows table exists (canary for schema)
result = await conn.execute(
    """
    SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'project_ai_workflows'
    )
    """
)
```

If migrations haven't run, tests skip with clear error message.

## Port Differences: CI vs Local

| Environment | Port | Reason |
|-------------|------|--------|
| **CI (GitHub Actions)** | 5432 | Clean container, no conflicts |
| **Local Development** | 55432 | Avoids conflict with host PostgreSQL |

### Local Development Port

The `docker-compose.test-db.yml` maps port 55432 → 5432:
```yaml
ports:
  - "55432:5432"
```

This allows developers to run integration tests locally without stopping their host PostgreSQL instance (which typically runs on port 5432).

### CI Port

GitHub Actions runs in a clean Ubuntu container with no pre-existing PostgreSQL. The service container uses standard port 5432:
```yaml
ports:
  - 5432:5432
```

The test fixtures automatically detect the correct port via the `TEST_DATABASE_URL_TUTORIAL` environment variable.

## Test Execution Steps

### 1. Install Dependencies

```yaml
- name: Install Python dependencies
  run: |
    cd services/project-ai
    pip install -e ".[dev]"
```

Installs pytest, pytest-asyncio, SQLAlchemy, asyncpg, and all dev dependencies.

### 2. Run Integration Tests

```yaml
- name: Run integration tests
  env:
    TEST_DATABASE_URL_TUTORIAL: postgresql+asyncpg://test_user:test_password@localhost:5432/tutorial_test
    JWT_SECRET: test_jwt_secret_minimum_32_characters_long_value
    ADMIN_JWT_SECRET: test_admin_jwt_secret_minimum_32_characters
  run: |
    cd services/project-ai
    pytest tests/integration/ -v --tb=short
```

**Test Categories:**
- Repository CRUD operations (17 tests in `test_repositories_integration.py`)
- Security integration tests (30 tests in `test_security_integration.py`)
- Authorization enforcement (10 tests in `test_authorization.py`)

**Total:** 57+ integration tests

### 3. Run Security Integration Tests

```yaml
- name: Run security integration tests
  env:
    TEST_DATABASE_URL_TUTORIAL: postgresql+asyncpg://test_user:test_password@localhost:5432/tutorial_test
    JWT_SECRET: test_jwt_secret_minimum_32_characters_long_value
    ADMIN_JWT_SECRET: test_admin_jwt_secret_minimum_32_characters
  run: |
    cd services/project-ai
    pytest tests/security/test_authorization.py -v -k integration --tb=short
```

Runs only integration tests from `test_authorization.py` (previously skipped tests now enabled).

## Workflow Triggers

### Push Events
```yaml
on:
  push:
    branches:
      - main
      - m2-project-ai-canonical-wiring
    paths:
      - 'services/project-ai/**'
      - 'packages/db-tutorial/**'
      - '.github/workflows/integration-tests.yml'
```

Runs on pushes to main or feature branches that modify:
- Project AI service code
- Database schema/migrations
- The workflow file itself

### Pull Request Events
```yaml
  pull_request:
    paths:
      - 'services/project-ai/**'
      - 'packages/db-tutorial/**'
```

Runs on PRs affecting the same paths.

## Local Development Workflow

### 1. Start Test Database

```bash
docker-compose -f services/project-ai/docker-compose.test-db.yml up -d
```

### 2. Run Migrations

```bash
cd packages/db-tutorial
pnpm db:migrate
```

**Note:** Set `DATABASE_URL` to point to port 55432:
```bash
export DATABASE_URL=postgresql://test_user:test_password@localhost:55432/tutorial_test
```

### 3. Configure Environment

```bash
cd services/project-ai
cp .env.test.example .env.test
```

### 4. Run Tests

```bash
pytest tests/integration/ -v
```

### 5. Stop Database

```bash
docker-compose -f services/project-ai/docker-compose.test-db.yml down
```

## Troubleshooting

### Tests Skip with "TEST_DATABASE_URL_TUTORIAL not configured"

**Cause:** Environment variable not set or incorrect.

**Solution:** Verify environment variable:
```bash
echo $TEST_DATABASE_URL_TUTORIAL
# Expected: postgresql+asyncpg://test_user:test_password@localhost:55432/tutorial_test (local)
# Expected: postgresql+asyncpg://test_user:test_password@localhost:5432/tutorial_test (CI)
```

### Tests Skip with "project_ai_workflows table does not exist"

**Cause:** Drizzle migrations haven't run.

**Solution:**
```bash
cd packages/db-tutorial
pnpm db:migrate
```

### Connection Refused Error

**Cause:** PostgreSQL not running or wrong port.

**Solution:**
```bash
# Check Docker container status
docker ps | grep project-ai-test-db

# Check port mapping
docker port project-ai-test-db
# Expected: 5432/tcp -> 0.0.0.0:55432

# Test connectivity
docker exec project-ai-test-db pg_isready -U test_user
```

### Health Check Failing in CI

**Cause:** PostgreSQL service container not ready.

**Solution:** GitHub Actions health check configuration is correct. If failing, check:
1. Service container logs in workflow run
2. PostgreSQL 17 image availability
3. Network connectivity in runner

## Schema Changes Workflow

When adding new columns or tables:

1. **Update Drizzle schema** (`packages/db-tutorial/src/schema/project-ai-persistence.ts`)
2. **Generate migration** (`pnpm db:generate`)
3. **Review SQL** (check generated migration file)
4. **Run migration** (`pnpm db:migrate`)
5. **Update SQLAlchemy models** (`services/project-ai/app/persistence/models.py`)
6. **Run integration tests** (`pytest tests/integration/ -v`)
7. **Commit both schema and migration files**

## Security Best Practices

### Secrets Management
- ✅ Use test-only secrets in CI
- ❌ Never log production secrets
- ❌ Never commit secrets to repository
- ✅ Use GitHub Secrets for sensitive values (if needed)

### Database Isolation
- ✅ Service container is ephemeral (destroyed after workflow)
- ✅ No persistent data between runs
- ✅ Each test runs in isolated transaction (automatic rollback)

### Connection Security
- CI: `POSTGRES_HOST_AUTH_METHOD=trust` (acceptable for ephemeral test container)
- Production: Use proper authentication and SSL/TLS

## Performance Optimization

### tmpfs for Test Database (Local Only)

The `docker-compose.test-db.yml` uses tmpfs for PostgreSQL data:
```yaml
tmpfs:
  - /var/lib/postgresql/data
```

**Benefits:**
- Faster I/O (in-memory storage)
- Automatic cleanup (data destroyed when container stops)
- Reduced disk wear

**Limitation:** Not available in GitHub Actions service containers (uses standard disk storage).

### Parallel Test Execution

Integration tests can run in parallel with `pytest-xdist`:
```bash
pytest tests/integration/ -n auto
```

**Note:** Each test runs in isolated transaction, so parallelization is safe.

## Related Documentation

- **Test Fixtures:** `services/project-ai/tests/integration/conftest.py`
- **Environment Template:** `services/project-ai/.env.test.example`
- **Docker Compose:** `services/project-ai/docker-compose.test-db.yml`
- **GitHub Actions:** `.github/workflows/integration-tests.yml`
- **README:** `services/project-ai/README.md` (Integration Testing section)

## Summary

| Aspect | CI (GitHub Actions) | Local Development |
|--------|---------------------|-------------------|
| **Database** | postgres:17 service container | Docker Compose container |
| **Port** | 5432 | 55432 |
| **Migrations** | Automated in workflow | Manual: `pnpm db:migrate` |
| **Storage** | Disk (ephemeral) | tmpfs (in-memory) |
| **Health Check** | Automatic (workflow config) | Manual: `docker ps` |
| **Cleanup** | Automatic (workflow end) | Manual: `docker-compose down` |

**Key Principle:** Schema authority is Drizzle (TypeScript). Python application is read-only ORM consumer.
