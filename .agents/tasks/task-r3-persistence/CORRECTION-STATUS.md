# R3 Persistence Layer - Architecture Correction Status

**Date:** 2025-01-31  
**Status:** ✅ CORRECTED IN PLACE  
**Action Required:** Update workflow to use corrected FEAT files

---

## What Was Corrected

### Original Architecture (INVALID)
- Database: SQLite (`project_ai.db` file)
- Driver: aiosqlite
- Tests: In-memory SQLite (`:memory:`)
- Schema: auto-created by `create_all()` on startup
- Rationale: "No database found in services/project-ai"

### Corrected Architecture (APPROVED)
- Database: **Existing tutorial_prod PostgreSQL on Neon**
- Driver: **asyncpg**
- Tests: **PostgreSQL test database (explicit TEST_DATABASE_URL_TUTORIAL required)**
- Schema: **Created ONLY through migration authority discovered by FEAT-000 (Drizzle expected)**
- Rationale: Platform already has PostgreSQL + Drizzle, Project AI governs Tutorial blocks

---

## Files Updated (In Place)

✅ `task.json` - Updated feature_order to include FEAT-000, added architectural_constraints
✅ `context.json` - Updated with PostgreSQL requirements, Drizzle discovery, prohibited SQLite
✅ `features/FEAT-000.json` - **NEW** - Mandatory database architecture discovery
✅ `features/FEAT-001.json` - PostgreSQL infrastructure (was SQLite)
✅ `features/FEAT-002.json` - PostgreSQL ORM models and repositories  
✅ `features/FEAT-003.json` - Service integration (unchanged logic, PostgreSQL repos)
✅ `features/FEAT-004.json` - PostgreSQL test infrastructure (was SQLite)
✅ `features/FEAT-005.json` - Documentation with PostgreSQL architecture

---

## New Feature Order

**MANDATORY SEQUENTIAL:**

```
FEAT-000: Database Architecture Discovery (BLOCKING)
    ↓
FEAT-001: PostgreSQL Infrastructure
    ↓
FEAT-002: ORM Models & Repositories
    ↓
FEAT-003: Service Integration
    ↓
FEAT-004: PostgreSQL Test Infrastructure
    ↓
FEAT-005: Documentation & Verification
```

**FEAT-000 MUST complete before any implementation begins.**

---

## Key Architectural Constraints

### PROHIBITED

❌ SQLite database (sqlite, aiosqlite, project_ai.db)  
❌ New database creation (project_ai_prod, any separate database)  
❌ In-memory test databases (:memory:)  
❌ SQLite-specific SQL (INSERT OR IGNORE)

### REQUIRED

✅ Use existing tutorial_prod PostgreSQL database  
✅ Use DATABASE_URL_TUTORIAL environment variable  
✅ Use asyncpg driver (postgresql+asyncpg://)  
✅ Use PostgreSQL test database with explicit TEST_DATABASE_URL_TUTORIAL (no implicit fallback)  
✅ Use PostgreSQL SQL (ON CONFLICT DO NOTHING)  
✅ Namespace tables with project_ai_ prefix  
✅ Schema changes ONLY through migration authority discovered by FEAT-000 (Drizzle expected)  
✅ init_db() validates connectivity only, does NOT run create_all() or mutate schema  
✅ No route instantiates repositories/sessions directly (all through FastAPI dependency layer)

---

## Hard Rules for Agents

### RULE 1: Discovery First
**FEAT-000 is MANDATORY before any schema changes.**  
No implementation may proceed until database architecture is discovered and documented in r3-database-discovery.md.

### RULE 2: Database Selection
**Must use tutorial_prod (existing PostgreSQL database).**  
Creating project_ai_prod, project_ai.db, or any other database is FORBIDDEN.

### RULE 3: Technology Stack
**SQLite is FORBIDDEN in all Project AI code.**  
Production and tests must use PostgreSQL exclusively.

### RULE 4: Migration Coordination
**FEAT-000 discovers migration authority. Default assumption: Drizzle owns tutorial_prod.**  
Python Project AI uses SQLAlchemy for data access ONLY. Schema changes through discovered migration authority. Do not introduce Alembic unless repository evidence proves Python-owned migrations already exist.

### RULE 5: Test Infrastructure
**Tests MUST use PostgreSQL.**  
In-memory SQLite fixtures are invalid for production PostgreSQL verification.

### RULE 6: SQL Dialect
**All SQL must be PostgreSQL-compatible.**  
Use ON CONFLICT, JSONB, DateTime(timezone=True), not SQLite equivalents.

---

## Verification Checklist

Before approving any R3 implementation:

- [ ] FEAT-000 completed and r3-database-discovery.md exists
- [ ] Connects to tutorial_prod (NOT project_ai.db or project_ai_prod)
- [ ] Uses asyncpg driver (NOT aiosqlite)
- [ ] Uses PostgreSQL SQL dialect (ON CONFLICT, JSONB)
- [ ] Tests run against PostgreSQL (NOT :memory:)
- [ ] Tables namespaced with project_ai_ prefix
- [ ] Schema changes ONLY through migration authority (NOT create_all())
- [ ] Coordinates with Drizzle migrations (per FEAT-000 findings)
- [ ] TEST_DATABASE_URL_TUTORIAL explicitly required (no implicit fallback)
- [ ] No route instantiates repositories/sessions directly
- [ ] No SQLite imports anywhere in production code
- [ ] Service starts and logs "Database initialized (tutorial_prod)"
- [ ] Workflow persists across restart with same contract_sha256

---

## Workflow Status

**Current Workflow:** wf_17098bae4c4091f9  
**Status:** Planning step completed (this step)  
**Queued Steps:** Replace existing tail with corrected FEAT sequence

### Action Required

The planning step already executed `update_workflow` with the **ORIGINAL (INVALID) FEAT sequence**. That update is **queued** but not yet applied.

**Options:**

**A. Cancel and restart workflow** (RECOMMENDED)
- Cancel workflow wf_17098bae4c4091f9
- Start new workflow reading corrected FEAT files
- Clean execution from corrected architecture

**B. Let workflow continue with corrections**
- The queued update will use OLD FEAT prompts (SQLite-based)
- First coder step will read FEAT-001.json (now corrected to PostgreSQL)
- Mismatch between workflow step prompt and FEAT file content
- Could cause confusion

**C. Manually update workflow tail**
- Call update_workflow again with corrected step prompts
- Overwrite queued tail with PostgreSQL-based prompts
- Complex - requires rewriting all 6 step prompts

**Recommendation: Option A** - Cancel and restart for clean execution.

---

## Evidence Trail

### Original Documents (Reference Only)
- `.agents/tasks/r3-persistence-audit.md` - Original audit (SQLite recommendation)
- `.agents/tasks/r3-plan.md` - Original 20-step plan (SQLite-based)
- `.agents/tasks/r3-architecture-correction.md` - Complete analysis of correction
- `.agents/tasks/r3-plan-corrected.md` - Corrected 20-step plan (PostgreSQL)
- `.agents/tasks/r3-correction-summary.md` - Executive summary

### Canonical Task (Current)
- `.agents/tasks/task-r3-persistence/` - **USE THIS**
  - `task.json` - ✅ CORRECTED
  - `context.json` - ✅ CORRECTED
  - `features/FEAT-000.json` - ✅ NEW (discovery)
  - `features/FEAT-001.json` - ✅ CORRECTED (PostgreSQL)
  - `features/FEAT-002.json` - ✅ CORRECTED (PostgreSQL)
  - `features/FEAT-003.json` - ✅ CORRECTED (PostgreSQL)
  - `features/FEAT-004.json` - ✅ CORRECTED (PostgreSQL)
  - `features/FEAT-005.json` - ✅ CORRECTED (PostgreSQL)
  - `CORRECTION-STATUS.md` - This file

---

## Next Steps

### For Workflow Orchestrator

1. **STOP current workflow** wf_17098bae4c4091f9 (queued tail has invalid prompts)
2. **Start new workflow** reading task-r3-persistence with corrected FEATs
3. **Ensure FEAT-000 executes first** (mandatory discovery)
4. **Verify each FEAT reads corrected FEAT-*.json files** (not old step prompts)

### For Implementation Agents

When new workflow starts:

1. **Read CORRECTION-STATUS.md first** (this file)
2. **Execute FEAT-000 before any code** (discovery is mandatory)
3. **Read r3-database-discovery.md before FEAT-001** (use discovered facts)
4. **Verify PostgreSQL connection at each step** (not SQLite)
5. **Follow corrected FEAT-*.json steps exactly**

---

## Success Criteria

### Immediate
- ✅ All FEAT files corrected with PostgreSQL architecture
- ✅ FEAT-000 added as mandatory discovery step
- ✅ task.json updated with architectural constraints
- ✅ context.json updated with PostgreSQL requirements
- ✅ All references to SQLite removed from FEAT files

### Implementation Phase
- [ ] FEAT-000 discovers existing Drizzle architecture
- [ ] FEAT-001 connects to tutorial_prod successfully
- [ ] FEAT-002 creates project_ai_* tables in tutorial_prod
- [ ] FEAT-003 replaces in-memory stores with PostgreSQL repositories
- [ ] FEAT-004 tests run against PostgreSQL
- [ ] FEAT-005 documents PostgreSQL persistence

### Verification Phase
- [ ] All tests pass with 80%+ coverage
- [ ] Service starts and logs "tutorial_prod"
- [ ] Workflow persists across restart
- [ ] Contract hash unchanged after restart
- [ ] psql $DATABASE_URL_TUTORIAL -c '\dt project_ai_*' shows 6 tables

---

## Contact

For questions about R3 architecture correction:

- **This file:** CORRECTION-STATUS.md (status summary)
- **Detailed analysis:** r3-architecture-correction.md
- **Implementation plan:** r3-plan-corrected.md
- **Executive summary:** r3-correction-summary.md

**Do not use original r3-plan.md (SQLite-based).**  
**Use task-r3-persistence/*.json files only.**

---

**Status:** ✅ Architecture correction complete, ready for workflow restart
