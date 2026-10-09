# R3 Architecture Correction - MANDATORY READ BEFORE IMPLEMENTATION

**Date:** 2025-01-31
**Status:** BLOCKING - Original R3 plan INVALID
**Architecture Owner Decision:** Use existing PostgreSQL database, NOT SQLite

---

## Critical Finding

The original R3 audit and plan **incorrectly recommended SQLite** because it examined `services/project-ai` in isolation and found no database infrastructure in that specific service directory.

**This was a LOCAL finding, not a PLATFORM finding.**

The platform **already has PostgreSQL + Drizzle ORM infrastructure** serving:
- Tutorial content (tutorial_prod database)
- Quiz platform (quiz_platform_prod database)  
- SkillHubCore hierarchy
- People/auth (people_prod database)
- Payment (payment_prod database)
- Placement (placement_prod database)

**Database Provider:** Neon (serverless PostgreSQL)
**ORM:** Drizzle (TypeScript)
**Migrations:** drizzle-kit
**Driver:** @neondatabase/serverless

---

## Architectural Decision (BINDING)

**Project AI MUST use the existing PostgreSQL database that stores Tutorial page content and Tutorial blocks.**

### Why

1. **Project AI governs Tutorial block creation/modification** - its persistence belongs with Tutorial data
2. **Same infrastructure** - no duplicate database provisioning, credentials, backups
3. **Coherent architecture** - workflow → target → contract → candidate → manifest → placement all reference Tutorial blocks
4. **No artificial separation** - Python vs TypeScript is an implementation detail, not a database boundary

### Database Choice

**Use:** `tutorial_prod` (the existing Tutorial database on Neon)

**NOT:**
- ❌ `project_ai_prod` (new database)
- ❌ `project_ai.db` (SQLite file)
- ❌ Any isolated database

### Table Strategy

Project AI tables will be **namespaced within the existing database**:

**Option A (Preferred if existing conventions support it):**
```sql
-- PostgreSQL schema-based namespace
CREATE SCHEMA project_ai;

CREATE TABLE project_ai.workflows (...);
CREATE TABLE project_ai.state_transitions (...);
CREATE TABLE project_ai.contracts (...);
CREATE TABLE project_ai.candidates (...);
CREATE TABLE project_ai.manifests (...);
CREATE TABLE project_ai.approvals (...);
```

**Option B (Fallback if schema not used):**
```sql
-- Table prefix namespace
CREATE TABLE project_ai_workflows (...);
CREATE TABLE project_ai_state_transitions (...);
CREATE TABLE project_ai_contracts (...);
CREATE TABLE project_ai_candidates (...);
CREATE TABLE project_ai_manifests (...);
CREATE TABLE project_ai_approvals (...);
```

---

## Technology Stack Correction

### REMOVE from R3 Plan

❌ SQLite
❌ aiosqlite driver
❌ `sqlite+aiosqlite:///./project_ai.db`
❌ In-memory SQLite for tests
❌ SQLite-specific SQL (`INSERT OR IGNORE`)

### ADD to R3 Plan

✅ PostgreSQL (existing tutorial_prod database)
✅ asyncpg driver (Python async PostgreSQL)
✅ `postgresql+asyncpg://...neon.tech/tutorial_prod`
✅ PostgreSQL test database/schema
✅ PostgreSQL-specific SQL (`ON CONFLICT DO NOTHING`)

### Keep (Still Valid)

✅ SQLAlchemy 2.0 async (Python ORM - cannot use TypeScript Drizzle)
✅ Alembic (Python migrations - see migration strategy below)
✅ Repository pattern
✅ FastAPI dependency injection
✅ Optimistic locking
✅ Hash verification
✅ Idempotency keys

---

## Migration Strategy

**CRITICAL:** Do NOT blindly introduce Alembic.

### Investigation Required (R3-0)

Before any schema changes, determine:

1. **Does tutorial_prod database use Drizzle for ALL schema changes?**
   - YES → Coordinate with Drizzle migrations, OR
   - NO → Determine existing Python migration pattern

2. **Who owns tutorial_prod schema authority?**
   - TypeScript application → Project AI tables via Drizzle schema extension
   - Mixed ownership → Project AI may use Alembic for its own tables
   - Python already owns some tables → Follow existing pattern

3. **Existing test database strategy?**
   - Determine how Tutorial tests handle PostgreSQL
   - Reuse same pattern for Project AI tests

### Likely Migration Architecture

**Scenario A: Drizzle owns tutorial_prod schema**
```
TypeScript packages/db-tutorial
  └── Drizzle schema
      └── Add project_ai tables
      └── drizzle-kit generate
      └── drizzle-kit migrate
```

Then Python Project AI:
```
SQLAlchemy models
  └── asyncpg
      └── Read/write project_ai tables
      └── NO migrations (Drizzle owns schema)
```

**Scenario B: Mixed ownership allowed**
```
TypeScript: Drizzle (existing tables)
Python: Alembic (project_ai_* tables only)
```

**DO NOT ASSUME Scenario B. Verify with R3-0.**

---

## R3 Workflow Correction

### Original (INVALID)

```
FEAT-001: Database Infrastructure (SQLite)
  ↓
FEAT-002: Repository Layer
  ↓
FEAT-003: Service Integration
  ↓
FEAT-004: Test Infrastructure
  ↓
FEAT-005: Documentation
```

### Corrected (MANDATORY)

```
R3-0: Database Architecture Discovery
      │
      │ Inspect existing tutorial_prod
      │ Determine migration ownership
      │ Determine schema strategy
      │ Determine test DB pattern
      │
      ▼
R3-1: PostgreSQL Infrastructure Setup
      │
      │ Connect to tutorial_prod
      │ Define project_ai tables/schema
      │ Setup asyncpg + SQLAlchemy
      │ Coordinate with existing migrations
      │
      ▼
R3-2: Repository Layer
      │
      │ Repository Protocols
      │ SQLAlchemy implementations
      │ PostgreSQL-specific patterns
      │
      ▼
R3-3: Service Integration
      │
      │ Replace in-memory stores
      │ FastAPI dependencies
      │
      ▼
R3-4: PostgreSQL Test Infrastructure
      │
      │ Test database/schema
      │ PostgreSQL fixtures
      │ Integration tests
      │
      ▼
R3-5: Documentation & Verification
```

---

## Database Connection Pattern

### Environment Variables

Project AI should use existing database environment variable:

```bash
# Existing (from .env.local)
DATABASE_URL_TUTORIAL="postgresql://neondb_owner:...@ep-solitary-hill...tutorial_prod?sslmode=require"

# Project AI uses same database
# services/project-ai/.env
DATABASE_URL=${DATABASE_URL_TUTORIAL}
```

**OR** if Project AI needs its own variable for clarity:

```bash
PROJECT_AI_DATABASE_URL=${DATABASE_URL_TUTORIAL}
```

### Python Connection

```python
# services/project-ai/app/database/session.py
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
import os

# Use existing tutorial_prod database
DATABASE_URL = os.getenv('DATABASE_URL_TUTORIAL')
if not DATABASE_URL:
    raise ValueError("DATABASE_URL_TUTORIAL required for Project AI persistence")

# asyncpg driver for PostgreSQL
engine = create_async_engine(
    DATABASE_URL.replace('postgresql://', 'postgresql+asyncpg://'),
    echo=False,
    pool_size=10,
    max_overflow=20
)
```

---

## PostgreSQL-Specific Patterns

### Idempotent Insert (Contract Immutability)

**SQLite (WRONG):**
```sql
INSERT OR IGNORE INTO contracts ...
```

**PostgreSQL (CORRECT):**
```sql
INSERT INTO project_ai_contracts (workflow_id, contract_hash, ...)
VALUES ($1, $2, ...)
ON CONFLICT (workflow_id) DO NOTHING
RETURNING *;
```

### Optimistic Locking

```sql
UPDATE project_ai_workflows
SET 
    current_state = $1,
    version = version + 1,
    updated_at = NOW()
WHERE 
    workflow_id = $2
    AND version = $3  -- Expected version
RETURNING *;
```

If `rowcount == 0` → OptimisticLockError

### JSON Columns

PostgreSQL supports both `json` and `jsonb`:

```python
from sqlalchemy import JSON
from sqlalchemy.dialects.postgresql import JSONB

class WorkflowModel(Base):
    __tablename__ = 'project_ai_workflows'
    
    gate_results = Column(JSONB, nullable=False, default={})
    evidence_ids = Column(JSONB, nullable=False, default=[])
```

Use `JSONB` for queryable JSON, `JSON` for opaque blobs.

---

## Test Strategy Correction

### WRONG (Original Plan)

```python
# In-memory SQLite for tests
DATABASE_URL = "sqlite+aiosqlite:///:memory:"
```

### CORRECT

**Option A: PostgreSQL test database**
```python
# Dedicated test database on Neon
TEST_DATABASE_URL = "postgresql+asyncpg://...neon.tech/tutorial_test"
```

**Option B: PostgreSQL test schema**
```python
# Same database, test schema
TEST_DATABASE_URL = "postgresql+asyncpg://...neon.tech/tutorial_prod"
# Create/drop project_ai_test schema per test run
```

**Option C: PostgreSQL Docker container (local only)**
```yaml
# docker-compose.test.yml
services:
  postgres:
    image: postgres:17
    environment:
      POSTGRES_DB: tutorial_test
```

**R3-0 MUST determine which pattern the existing project uses.**

---

## What Must Change in Existing FEAT Files

### FEAT-001.json (Database Infrastructure)

**WRONG:**
```json
{
  "steps": [
    "Add sqlalchemy[asyncio]>=2.0.0, alembic>=1.13.0, aiosqlite>=0.19.0",
    "Create AsyncEngine with sqlite+aiosqlite:///./project_ai.db",
    "Initialize Alembic: alembic init alembic"
  ]
}
```

**CORRECT:**
```json
{
  "steps": [
    "R3-0: Inspect packages/db-tutorial for Drizzle schema, migration patterns, test DB strategy",
    "Determine if project_ai tables should be Drizzle-owned or Alembic-owned",
    "Add asyncpg>=0.29.0 to pyproject.toml (SQLAlchemy async already listed)",
    "Connect to existing tutorial_prod via DATABASE_URL_TUTORIAL",
    "Define project_ai schema OR project_ai_* table prefix based on existing conventions",
    "Coordinate migration strategy with existing Drizzle migrations"
  ]
}
```

### FEAT-002.json (Repository Layer)

**Keep** repository abstractions, but change SQL dialect:

```python
# WRONG
session.execute(text("INSERT OR IGNORE INTO contracts ..."))

# CORRECT  
session.execute(text("""
    INSERT INTO project_ai_contracts (workflow_id, ...)
    VALUES (:workflow_id, ...)
    ON CONFLICT (workflow_id) DO NOTHING
"""))
```

### FEAT-004.json (Test Infrastructure)

**WRONG:**
```python
@pytest.fixture
def db_engine():
    engine = create_async_engine("sqlite+aiosqlite:///:memory:")
```

**CORRECT:**
```python
@pytest.fixture
def db_engine():
    # Use PostgreSQL test database from existing project conventions
    test_db_url = os.getenv('TEST_DATABASE_URL_TUTORIAL') or 'postgresql+asyncpg://localhost/tutorial_test'
    engine = create_async_engine(test_db_url)
```

---

## Hard Rules for R3 Implementation

### RULE 1: Database Selection
**Project AI MUST use tutorial_prod (existing PostgreSQL database).**
Agents may NOT create project_ai_prod, project_ai.db, or any other database without explicit architecture owner approval.

### RULE 2: Technology Stack
**SQLite is FORBIDDEN in Project AI production code.**
Only PostgreSQL + asyncpg is allowed for persistence.

### RULE 3: Migration Coordination
**Agents MUST determine existing migration ownership before creating Alembic migrations.**
If tutorial_prod is Drizzle-owned, coordinate with TypeScript team or use Drizzle for project_ai tables.

### RULE 4: Test Infrastructure
**Tests MUST use PostgreSQL, not SQLite.**
In-memory SQLite test fixtures are invalid for production PostgreSQL verification.

### RULE 5: Table Ownership
**Project AI may create dedicated project_ai_* tables.**
Project AI may NOT modify existing tutorial_pages, tutorial_blocks, or other Tutorial tables directly.

### RULE 6: Connection Reuse
**Use existing DATABASE_URL_TUTORIAL environment variable.**
Do not invent new database credentials or connection patterns.

### RULE 7: SQL Dialect
**All SQL must be PostgreSQL 17-compatible.**
SQLite-specific syntax (`INSERT OR IGNORE`, `AUTOINCREMENT`, etc.) is invalid.

### RULE 8: Discovery Before Implementation
**R3-0 (Database Architecture Discovery) is MANDATORY before any schema changes.**
No agent may proceed with FEAT-001 without completing R3-0 first.

---

## Verification Checklist

Before approving any R3 implementation, verify:

- [ ] Connects to tutorial_prod (NOT project_ai.db)
- [ ] Uses asyncpg driver (NOT aiosqlite)
- [ ] Uses PostgreSQL SQL dialect (NOT SQLite)
- [ ] Tests run against PostgreSQL (NOT :memory: SQLite)
- [ ] Follows existing migration strategy (Drizzle OR coordinated Alembic)
- [ ] Tables namespaced (schema OR prefix)
- [ ] Does not modify existing Tutorial tables
- [ ] Reuses existing DATABASE_URL_TUTORIAL
- [ ] R3-0 discovery completed first
- [ ] No SQLite imports in production code

---

## Status

**Current R3 Plan:** INVALID - based on incorrect SQLite assumption
**Corrected R3 Plan:** IN PROGRESS - this document defines corrections
**Blocking Issue:** FEAT-001 would create SQLite infrastructure
**Resolution:** Rewrite all 5 FEATs with PostgreSQL architecture

**Next Action:** Update task-r3-persistence FEAT files with PostgreSQL architecture before allowing workflow to proceed.
