# FEAT-000: Database Discovery Report — M2.9 R3 Durable Persistence Layer

**Discovery Date:** 2025-01-XX  
**Database:** `tutorial_prod` (Neon PostgreSQL, hosted on ap-southeast-1)  
**Purpose:** Establish migration authority and architecture decisions for Project AI persistence layer

---

## 1. Migration Authority Decision

**DECISION: DRIZZLE-ONLY**

**Rationale:**

1. **Drizzle owns all migrations for `tutorial_prod`:**
   - 27 migration files exist in `packages/db-tutorial/migrations/` (0000 through 0025)
   - Migration journal at `packages/db-tutorial/migrations/meta/_journal.json` confirms Drizzle Kit v7
   - `drizzle.config.ts` configures PostgreSQL dialect with schema source at `./src/schema/*.ts`
   - 54 schema files define all existing tables

2. **No Python/Alembic migrations exist:**
   - No `alembic/` directory in `services/project-ai/`
   - No `alembic.ini` configuration file
   - No migration files in Python service

3. **Python code acknowledges Drizzle authority:**
   - `services/project-ai/app/database/session.py` contains comments referencing "Alembic" but these are **aspirational placeholders**, not actual implementation
   - Error message says "Run Alembic migrations: alembic upgrade head" but this is **incorrect documentation**
   - No actual Alembic setup exists

4. **SQLAlchemy models exist but schema creation is disabled:**
   - `app/database/models.py` defines 6 ORM models for `project_ai_*` tables
   - `app/database/session.py` explicitly forbids `create_all()`: "NO schema mutations in application code"
   - Startup only validates table existence, does not create tables

5. **Dependencies confirm Drizzle:**
   - `pyproject.toml` lists `alembic>=1.13.0` and `asyncpg>=0.29.0` as **dependencies**, but this is **preparatory** — no migrations exist yet
   - `packages/db-tutorial/package.json` has Drizzle scripts: `db:generate`, `db:migrate`, `db:studio`

**Conclusion:**

Drizzle is the sole migration authority. Project AI must add `project_ai_*` table migrations via **Drizzle TypeScript schema** in `packages/db-tutorial/src/schema/`, then run `pnpm --filter @quiz/db-tutorial db:generate` to create SQL migrations.

The Python SQLAlchemy models are **read-only ORM mappings** for runtime use. They do NOT create schema.

---

## 2. Database Connection

**Environment Variables:**

- **Primary Connection:** `DATABASE_URL_TUTORIAL`
- **Direct Connection (bypasses pooler):** `DATABASE_DIRECT_URL_TUTORIAL`

**Connection Details (from `.env.local`):**

```
DATABASE_URL_TUTORIAL=postgresql://neondb_owner:npg_QjFse2RHgY1h@ep-solitary-hill-a1m0s7zl-pooler.ap-southeast-1.aws.neon.tech/tutorial_prod?sslmode=require&channel_binding=require

DATABASE_DIRECT_URL_TUTORIAL=postgresql://neondb_owner:npg_QjFse2RHgY1h@ep-solitary-hill-a1m0s7zl.ap-southeast-1.aws.neon.tech/tutorial_prod?sslmode=require&channel_binding=require
```

**Host:** `ep-solitary-hill-a1m0s7zl-pooler.ap-southeast-1.aws.neon.tech` (pooled)  
**Port:** Default PostgreSQL (5432)  
**Database Name:** `tutorial_prod`  
**Driver:** Neon Serverless (`@neondatabase/serverless`) for TypeScript, `asyncpg` for Python

**Python Connection Pattern:**

Python service uses `DATABASE_URL` (not `DATABASE_URL_TUTORIAL`). This must be corrected:

- Current: `services/project-ai/app/database/session.py` reads `DATABASE_URL`
- Required: Should read `DATABASE_URL_TUTORIAL` to match TypeScript convention

**Connection Factory:**

TypeScript uses `getTutorialDb()` with connection pooling (max 15 for pooled, 5 for direct).

---

## 3. Schema Ownership

**Safe to add `project_ai_*` tables:** ✅ **YES**

**Existing Schema (27 migrations, 40+ tables):**

The `tutorial_prod` database contains tutorial/educational content tables with clear naming patterns:

- Tutorial domain hierarchy: `tutorial_domains`, `tutorial_subjects`, `tutorial_topics`, `tutorial_subtopics`
- Tutorial content: `tutorial_sections`, `tutorial_page_content_v2`, `tutorial_sidebar_trees_v2`
- Learning state: `tutorial_progress`, `tutorial_navigation_progress`, `block_learning_state`, `block_telemetry_events`
- User interactions: `code_interactions`, `quiz_answers`, `practice_test_answers`, `visual_interactions`, `section_completions`
- AI generation: `ai_generation_orchestration`, `ai_section_generation_jobs`, `prompt_templates`, `content_review_queue`
- Analytics: `educational_architecture_performance`, `ai_generation_metrics`
- Layman hardening: `layman_audit_logs`, `layman_prompt_history`, `layman_content_revisions`
- Assignments/projects: `tutorial_assignments`, `assignment_progress`, `tutorial_projects`, `tutorial_project_submissions`
- Gamification: `badges`, `student_badges`, `certificates`, `student_streaks`
- Remediation: `remediation_triggers`, `domain_content_config`, `content_generation_jobs`

**No `project_ai_*` tables exist yet.** The namespace is clean.

**Naming Conflict Risk:** None. Project AI will use `project_ai_*` prefix which does not collide with existing `tutorial_*`, `layman_*`, `ai_*` (generation), or educational domain tables.

**Required Tables (from `app/database/models.py`):**

1. `project_ai_workflows` — workflow lifecycle state
2. `project_ai_state_transitions` — audit trail
3. `project_ai_contracts` — immutable engineering contracts
4. `project_ai_candidates` — candidate block packages
5. `project_ai_manifests` — placement decisions
6. `project_ai_approvals` — hash-bound approval records

---

## 4. Test Database Strategy

**Test Environment Variables:**

- No dedicated test database environment variable exists (`TEST_DATABASE_URL_TUTORIAL` is **not defined**)
- `.env.local` contains only production database URLs

**Current Test Strategy (TypeScript):**

From `packages/db-tutorial/src/db.ts`:

```typescript
if (databaseUrl === undefined || databaseUrl.trim().length === 0) {
  if (process.env.NODE_ENV === 'test') {
    return createTestDb(); // Returns mock stub
  }
  throw new Error('DATABASE_URL_TUTORIAL environment variable is required');
}

// If DATABASE_URL_TUTORIAL is set, use real database (even in test mode for integration tests)
```

**Test Isolation Approach:**

- **Unit tests:** Use in-memory stub (no database)
- **Integration tests:** Use real `tutorial_prod` database when `DATABASE_URL_TUTORIAL` is set
- **Transaction rollback:** No evidence of test transaction isolation found

**Python Test Strategy:**

- `services/project-ai/tests/` exists with unit/integration/e2e directories
- No `conftest.py` fixture file exists yet
- Tests currently use in-memory dictionaries (`approvals_store = {}`)

**Recommendation for FEAT-004:**

Create `TEST_DATABASE_URL_TUTORIAL` environment variable pointing to a separate test database (e.g., `tutorial_test`). FEAT-004 must:

1. Fail explicitly if test database not configured (no silent fallback to production)
2. Use PostgreSQL transaction rollback for test isolation
3. Create pytest fixtures in `conftest.py` for async database sessions

---

## 5. PostgreSQL Version and Features

**PostgreSQL Version:** **14+** (inferred from Neon platform and feature usage)

**Feature Availability:**

| Feature | Available | Evidence |
|---------|-----------|----------|
| **JSONB** | ✅ YES | Extensively used in 20+ tables (`content`, `gate_results`, `evidence_ids`, `features`, `metadata`, `payload`, `result`, `options`) |
| **ON CONFLICT** | ✅ YES | Used in migration `0015_backfill_summary_interview_ai_tutor_sections.sql`: `ON CONFLICT (...) DO NOTHING` |
| **Optimistic Locking** | ✅ YES | Supported via version columns (not yet implemented in migrations, but SQLAlchemy models include `version` column for workflows) |
| **GIN Indexes** | ✅ YES | Used for JSONB indexing: `CREATE INDEX idx_tutorial_content_content_gin ON tutorial_content USING gin (content)` |
| **UUID Primary Keys** | ✅ YES | All tables use `uuid PRIMARY KEY DEFAULT gen_random_uuid()` |
| **Enums** | ✅ YES | 30+ custom enums defined (`tutorial_difficulty`, `tutorial_question_type`, `layman_audit_action`, etc.) |
| **Async Operations** | ✅ YES | Neon Serverless supports WebSocket connections; asyncpg driver for Python |

**Conclusion:** All required features for Project AI persistence are available.

---

## 6. Existing Migrations Summary

**Migration Count:** 27 migrations (0000 through 0025)

**Migration Timeline:**

- **0000_t1_foundation** (Jan 2026): Core tutorial tables (content, progress, projects, submissions)
- **0001_content_type**: Added content type field
- **0002_easy_namorita**: Certificates and streaks
- **0003_flawless_surge**: Assignments and help requests
- **0004_neat_greymalkin**: Badges system
- **0005_nebulous_jane_foster**: Live session requests
- **0006_heavy_sally_floyd**: Remediation triggers
- **0007_tiny_bill_hollister**: Content versioning and audit
- **0008_opposite_wiccan**: Domain/subject/topic/subtopic hierarchy
- **0009_mv_student_weak_areas**: Materialized views for analytics
- **0010_looping_demo_foundation**: Content generation jobs
- **0011_add_layman_hardening_tables**: Layman constitutional audit/prompt/revision tables
- **0012_futuristic_pepper_potts**: Phase 1 P0 modular system (educational architectures, UI architectures, AI orchestration, sections)
- **0013–0018**: Additional Phase 1 features (AI tutor sections, overview sections, delivery indexes)
- **0019–0020**: V2 sidebar and page content tables
- **0021_sparkling_unus**: Unknown (file not inspected)
- **0022_broken_supernaut**: Navigation progress tracking
- **0023_lame_deathbird**: Block learning state
- **0024_first_wendell_rand**: Unknown (file not inspected)
- **0025_quiet_tenebrous**: Block telemetry events (idempotency)

**Key Tables Created:**

- **4 foundation tables** (0000): `tutorial_content`, `tutorial_progress`, `tutorial_projects`, `tutorial_project_submissions`
- **Domain hierarchy** (0008): `tutorial_domains`, `tutorial_subjects`, `tutorial_topics`, `tutorial_subtopics`
- **User interactions** (0012): `code_interactions`, `practice_test_answers`, `quiz_answers`, `section_completions`, `visual_interactions`
- **Layman hardening** (0011): `layman_audit_logs`, `layman_prompt_history`, `layman_content_revisions`
- **AI generation** (0012): `ai_generation_orchestration`, `ai_section_generation_jobs`, `educational_architectures`, `ui_architectures`
- **V2 delivery** (0019–0020): `tutorial_sidebar_trees_v2`, `tutorial_page_content_v2`
- **Learning progress** (0022–0025): `tutorial_navigation_progress`, `block_learning_state`, `block_telemetry_events`

**No `project_ai_*` tables exist.**

**Migration Patterns:**

- Idempotent: `CREATE TABLE IF NOT EXISTS`
- Enum safety: `IF NOT EXISTS` checks before creating enums
- JSONB defaults: `jsonb DEFAULT '[]'::jsonb` or `DEFAULT '{}'::jsonb`
- Indexes: GIN for JSONB, btree for foreign keys and queries
- Soft deletes: `deleted_at timestamp` columns
- Audit trails: `created_at`, `updated_at` timestamps

---

## 7. Existing Python DB Code

**Database Module:** `services/project-ai/app/database/`

**Files:**

1. **`session.py`** — Database connection factory
   - Uses `asyncpg` driver (`postgresql+asyncpg://`)
   - Creates `AsyncEngine` with connection pooling (pool_size=5, max_overflow=10)
   - Exports `get_db_session()` FastAPI dependency
   - **Validates table existence on startup** (does NOT create tables)
   - Explicitly forbids `Base.metadata.create_all()`: "NO schema mutations in application code"

2. **`models.py`** — SQLAlchemy ORM models
   - Defines 6 ORM models: `WorkflowModel`, `StateTransitionModel`, `ContractModel`, `CandidateModel`, `ManifestModel`, `ApprovalModel`
   - All models use `project_ai_*` table names
   - Relationships: `lazy='selectin'` for async compatibility
   - Indexes: Composite indexes on state, hashes, timestamps
   - JSON columns: `gate_results`, `evidence_ids`, `contract_data`, `files`, `required_changes`
   - Optimistic locking: `version` column on `WorkflowModel`

3. **`__init__.py`** — Empty module marker

**Library:** SQLAlchemy 2.0+ with async support (`sqlalchemy[asyncio]>=2.0.0`)

**Connection Pattern:**

```python
database_url = os.environ.get("DATABASE_URL")  # ❌ WRONG
# Should be:
database_url = os.environ.get("DATABASE_URL_TUTORIAL")  # ✅ CORRECT
```

**In-Memory Stores (to be replaced):**

From `app/api/routes/contract.py`:

```python
contracts_store = {}  # ❌ Volatile, non-durable
workflows_store = {}  # ❌ Volatile, non-durable
```

Comment acknowledges: "Wave 3 requirement: Replace with persistent storage (database, Redis, or file store)"

**Test Mocks:**

Tests currently use in-memory dictionaries:
- `approvals_store = {}` in multiple test files
- No database fixtures exist yet

**Conflicts:** None. Python code is **prepared** for PostgreSQL but not yet connected. ORM models are defined but tables do not exist.

---

## 8. Approved Architecture for FEAT-001

**Database:** Existing `tutorial_prod` PostgreSQL database (Neon, ap-southeast-1)

**Migration Authority:** Drizzle TypeScript schema + migrations

**Schema Namespace:** `project_ai_*` tables (6 tables required)

**Python Connection:**

1. Use `DATABASE_URL_TUTORIAL` environment variable (not `DATABASE_URL`)
2. Convert to `postgresql+asyncpg://` for SQLAlchemy AsyncEngine
3. Connection pooling: pool_size=5, max_overflow=10
4. Use `get_db_session()` FastAPI dependency for request-scoped sessions

**FEAT-001 Must Implement:**

### A. Drizzle Schema (TypeScript)

Create `packages/db-tutorial/src/schema/project-ai-persistence.ts`:

```typescript
// Define Drizzle schema for 6 project_ai_* tables:
// - project_ai_workflows
// - project_ai_state_transitions
// - project_ai_contracts
// - project_ai_candidates
// - project_ai_manifests
// - project_ai_approvals

// Match column names/types from app/database/models.py
// Use pgTable, uuid, text, timestamp, integer, jsonb, index
// Include all indexes from SQLAlchemy models
```

Export from `packages/db-tutorial/src/schema/index.ts`.

### B. Generate Migration

Run in `packages/db-tutorial/`:

```bash
pnpm db:generate
```

This creates `migrations/0026_<name>.sql` with `CREATE TABLE` statements.

### C. Apply Migration

Run in `packages/db-tutorial/`:

```bash
pnpm db:migrate
```

This applies the migration to `tutorial_prod`.

### D. Fix Python Connection

In `services/project-ai/app/database/session.py`:

```python
# BEFORE:
database_url = os.environ.get("DATABASE_URL")

# AFTER:
database_url = os.environ.get("DATABASE_URL_TUTORIAL")
```

Update error messages to reference `DATABASE_URL_TUTORIAL`.

### E. Update Startup Validation

Keep `validate_database_connectivity()` in `session.py` but:

1. Do NOT call `create_all()`
2. Verify `project_ai_*` tables exist
3. On missing table, error message: "Run Drizzle migration: pnpm --filter @quiz/db-tutorial db:migrate"

### F. FastAPI Lifespan Integration

In `services/project-ai/app/main.py`:

```python
@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: validate database connectivity
    from app.database.session import validate_database_connectivity
    await validate_database_connectivity()
    
    yield
    
    # Shutdown: close database connections
    from app.database.session import close_db
    await close_db()
```

---

## Forbidden Patterns for FEAT-001

**❌ DO NOT:**

1. **Create Alembic migrations**
   - Drizzle is the migration authority
   - Python code must NOT own schema changes

2. **Call `Base.metadata.create_all()`**
   - No schema mutations in application code
   - Startup validates connectivity only

3. **Use `DATABASE_URL` environment variable**
   - Must use `DATABASE_URL_TUTORIAL` to match TypeScript convention

4. **Create a new `project_ai_prod` database**
   - Tables go into existing `tutorial_prod` database

5. **Use SQLite or local database**
   - Must use Neon PostgreSQL

6. **Assume test database exists**
   - FEAT-004 must create explicit test database setup

7. **Mutate production schema at startup**
   - Validation only, no `CREATE`, `ALTER`, or `DROP`

---

## Summary: Critical Path for FEAT-001

**Migration Authority:** DRIZZLE-ONLY (Drizzle TypeScript schema → SQL migrations)

**Database:** Existing `tutorial_prod` (Neon PostgreSQL, ap-southeast-1)

**Namespace:** `project_ai_*` (6 tables, no conflicts)

**Python Role:** Read-only ORM mapping (SQLAlchemy AsyncSession + asyncpg driver)

**Environment Variable:** `DATABASE_URL_TUTORIAL` (pooled), `DATABASE_DIRECT_URL_TUTORIAL` (direct)

**Test Strategy:** FEAT-004 must create `TEST_DATABASE_URL_TUTORIAL` and PostgreSQL test isolation

**PostgreSQL Features:** JSONB, ON CONFLICT, optimistic locking, GIN indexes — all available

**Next Step:** FEAT-001 creates Drizzle schema, generates migration 0026, applies it, and connects Python service.

---

**Discovery Complete.** ✅

Gate file written to: `e:\onlinewebsites\quiz-platform\.agents\tasks\r3-feat-000-gate.json`
