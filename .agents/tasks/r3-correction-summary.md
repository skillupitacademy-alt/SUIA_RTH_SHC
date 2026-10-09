# R3 Architecture Correction - Summary

**Date:** 2025-01-31
**Status:** CORRECTED - Ready for implementation
**Critical Change:** SQLite → PostgreSQL (tutorial_prod)

---

## What Was Wrong

The original R3 audit examined `services/project-ai` in isolation, found no database infrastructure in that directory, and concluded:

> **"No database infrastructure found → Recommend SQLite for simplicity"**

This was a **local finding**, not a **platform finding**.

The platform already has:
- ✅ PostgreSQL on Neon (7 production databases)
- ✅ Drizzle ORM (TypeScript)
- ✅ Established migration patterns
- ✅ DATABASE_URL_TUTORIAL for tutorial_prod database

---

## Architectural Decision

**Project AI MUST use existing `tutorial_prod` PostgreSQL database.**

### Rationale

1. **Domain coherence** - Project AI governs Tutorial block creation/placement
2. **Infrastructure reuse** - No duplicate databases, credentials, backups
3. **Workflow binding** - Workflow → Target → Contract → Candidate → Manifest → Placement all reference Tutorial blocks
4. **Single persistence boundary** - Python vs TypeScript is implementation detail

### Database Choice

```
WRONG: project_ai.db (SQLite file)
WRONG: project_ai_prod (new PostgreSQL database)
CORRECT: tutorial_prod (existing PostgreSQL database)
```

### Table Strategy

```sql
-- Project AI tables in tutorial_prod with namespace prefix
project_ai_workflows
project_ai_state_transitions  
project_ai_contracts
project_ai_candidates
project_ai_manifests
project_ai_approvals
```

---

## Technology Stack

### REMOVE

❌ SQLite
❌ aiosqlite driver  
❌ `sqlite+aiosqlite:///./project_ai.db`
❌ In-memory SQLite tests
❌ SQLite-specific SQL (`INSERT OR IGNORE`)

### ADD

✅ PostgreSQL (tutorial_prod database)
✅ asyncpg driver (Python async PostgreSQL)
✅ `postgresql+asyncpg://...neon.tech/tutorial_prod`
✅ PostgreSQL test database/schema
✅ PostgreSQL-specific SQL (`ON CONFLICT DO NOTHING`)

### KEEP

✅ SQLAlchemy 2.0 async (Python ORM)
✅ Alembic (if Step 0 determines Python owns migrations)
✅ Repository pattern
✅ FastAPI dependency injection
✅ Optimistic locking
✅ Hash verification
✅ Idempotency keys

---

## Documents Created

1. **r3-architecture-correction.md** - Complete architectural analysis and rules
2. **r3-plan-corrected.md** - Full 20-step implementation plan with PostgreSQL
3. **r3-correction-summary.md** (this file) - Executive summary

---

## Files Updated

### Original Files (INVALID)

- ❌ `.agents/tasks/r3-persistence-audit.md` - Recommended SQLite
- ❌ `.agents/tasks/r3-plan.md` - SQLite implementation plan
- ❌ `.agents/tasks/task-r3-persistence/features/FEAT-001.json` - SQLite infrastructure
- ❌ `.agents/tasks/task-r3-persistence/features/FEAT-002.json` - SQLite repositories
- ❌ `.agents/tasks/task-r3-persistence/features/FEAT-004.json` - SQLite tests

### Status

**These files should NOT be used for implementation.**
**Use r3-plan-corrected.md instead.**

---

## New R3 Workflow

### Mandatory First Step

**Step 0: Database Architecture Discovery (BLOCKING)**

Must complete before any schema changes:

1. Inspect `packages/db-tutorial/drizzle.config.ts`
2. Examine existing Drizzle schema in `packages/db-tutorial/src/schema/`
3. Review existing migrations in `packages/db-tutorial/migrations/`
4. Determine if Drizzle owns tutorial_prod schema exclusively
5. Identify test database strategy
6. Document findings in `r3-database-discovery.md`

**Output:** Migration strategy recommendation (Drizzle vs Alembic)

### Implementation Sequence

```
Step 0: Database Discovery (MANDATORY FIRST)
  ↓
Step 1: Add asyncpg dependency
  ↓  
Step 2: Create PostgreSQL connection layer
  ↓
Step 3: Define SQLAlchemy ORM models
  ↓
Step 4: Define Repository Protocols
  ↓
Step 5: Implement PostgreSQL repositories
  ↓
Step 6: Migration strategy (Drizzle coordination)
  ↓
Steps 7-12: Service integration
  ↓
Steps 13-16: PostgreSQL test infrastructure
  ↓
Steps 17-18: Documentation
  ↓
Steps 19-20: Verification and commit
```

---

## Hard Rules

### RULE 1: Database Selection
**Project AI MUST use tutorial_prod.**
Creating project_ai_prod or project_ai.db is FORBIDDEN without architecture owner approval.

### RULE 2: Technology Stack  
**SQLite is FORBIDDEN in Project AI production.**
Only PostgreSQL + asyncpg allowed.

### RULE 3: Migration Coordination
**Determine existing migration ownership before creating Alembic.**
If Drizzle owns tutorial_prod schema, coordinate with TypeScript team.

### RULE 4: Test Infrastructure
**Tests MUST use PostgreSQL.**
In-memory SQLite test fixtures are invalid.

### RULE 5: Discovery First
**Step 0 is MANDATORY before any schema changes.**
No agent may proceed without completing discovery.

---

## What Agents Must Do

### Before Starting FEAT-001

1. **Read r3-architecture-correction.md** - Understand architectural decisions
2. **Read r3-plan-corrected.md** - Follow corrected implementation plan
3. **Complete Step 0 (Discovery)** - Mandatory before any code changes
4. **Verify DATABASE_URL_TUTORIAL** - Ensure environment variable exists
5. **Ignore original FEAT-001.json** - It describes SQLite infrastructure

### During Implementation

- Use `postgresql+asyncpg://` connection strings
- Use `ON CONFLICT` syntax (not `INSERT OR IGNORE`)
- Test against PostgreSQL (not `:memory:` SQLite)
- Coordinate migrations with existing Drizzle patterns
- Namespace tables with `project_ai_` prefix

### Verification

- [ ] Connects to tutorial_prod (verify with psql)
- [ ] Uses asyncpg driver (check imports)
- [ ] Tables created in tutorial_prod (psql \dt project_ai_*)
- [ ] Tests run against PostgreSQL (not SQLite)
- [ ] Service starts successfully
- [ ] Workflow persists across restart
- [ ] Contract hash preserved across restart

---

## Critical Success Metrics

1. **No SQLite** - Zero SQLite references in production code
2. **PostgreSQL connection** - Service connects to tutorial_prod
3. **Restart safety** - Workflow state survives restart
4. **Hash immutability** - Contract hash unchanged after restart
5. **Test validity** - All tests run against PostgreSQL
6. **Migration coordination** - No conflicts with existing Drizzle schema

---

## Next Actions

### For Planning Agent (Complete)

✅ Created r3-architecture-correction.md
✅ Created r3-plan-corrected.md  
✅ Created r3-correction-summary.md
✅ Documented architectural decisions
✅ Provided corrected implementation plan

### For Workflow Orchestrator

- [ ] **PAUSE current workflow** - Do not execute original FEAT-001
- [ ] **Update FEAT files** - Rewrite with PostgreSQL architecture
- [ ] **Add Step 0** - Database discovery as mandatory first step
- [ ] **Restart workflow** - Execute corrected plan

### For Implementation Agents

When workflow resumes:

1. **Read correction documents FIRST**
2. **Execute Step 0 (Discovery) BEFORE any code changes**
3. **Follow r3-plan-corrected.md step-by-step**
4. **Verify PostgreSQL connection at each step**
5. **Test against PostgreSQL (never SQLite)**

---

## Estimated Timeline

- **Discovery (Step 0):** 1-2 hours
- **Infrastructure (Steps 1-6):** 4-5 hours  
- **Integration (Steps 7-12):** 3-4 hours
- **Testing (Steps 13-16):** 2-3 hours
- **Documentation (Steps 17-20):** 1-2 hours
- **Total:** 11-16 hours (vs 8-12 hours for SQLite - extra time for coordination)

---

## Risk Mitigation

### Risk: Breaking existing tutorial_prod schema

**Mitigation:**
- Step 0 discovers existing schema
- Tables namespaced with `project_ai_` prefix
- No modification of existing tutorial tables
- Coordinate migrations with Drizzle owner

### Risk: Test database conflicts

**Mitigation:**
- Step 0 identifies existing test DB strategy
- Use dedicated tutorial_test database OR test schema
- Transaction rollback for test isolation
- No shared test data with Tutorial tests

### Risk: Connection pool exhaustion

**Mitigation:**
- Configure SQLAlchemy pool_size=10, max_overflow=20
- Reuse existing Neon connection pooling
- Monitor connection usage in tests
- Close sessions properly in FastAPI dependencies

---

## Approval Status

**Architecture Decision:** ✅ APPROVED by architecture owner
**Original R3 Plan:** ❌ REJECTED (SQLite-based)
**Corrected R3 Plan:** ✅ READY FOR IMPLEMENTATION
**Blocking Issues:** ⚠️ Original workflow must be paused
**Required Action:** Update FEAT files before execution

---

## Contact

For questions about R3 architecture correction:
- Read: r3-architecture-correction.md (complete analysis)
- Review: r3-plan-corrected.md (implementation steps)
- Check: This summary for quick reference

**Do not proceed with original SQLite plan.**
**Use corrected PostgreSQL plan only.**
