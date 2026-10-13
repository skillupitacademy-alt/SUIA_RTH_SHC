# Migration Authority Policy

**Status:** ACTIVE  
**Version:** 1.0  
**Last Updated:** 2026-10-09  
**Scope:** All services accessing `tutorial_prod` database

---

## Decision

**Drizzle ORM** in `packages/db-tutorial` is the **single source of truth** for all database schema changes.

All services — TypeScript and Python alike — are **read-only consumers** of the schema. No service may perform DDL (Data Definition Language) operations.

---

## Rationale

### Single Source of Truth

Unified schema authority prevents:

- **Schema drift** — Multiple migration tools creating conflicting schema versions
- **Lost migrations** — Changes made outside version control
- **Deployment conflicts** — Services expecting different schema states
- **Debugging complexity** — Unclear which tool created which table/column

### TypeScript-First Schema Design

Drizzle's TypeScript-first approach provides:

- **Type safety** — Schema changes update TypeScript types automatically
- **Refactoring confidence** — Compiler catches breaking changes
- **Developer experience** — Autocomplete and inline documentation
- **Ecosystem integration** — Works seamlessly with Next.js, tRPC, Prisma ecosystem

### Security Boundary

Enforcing read-only ORM in Python prevents:

- **Accidental schema mutations** — No `create_all()`, `drop_all()`, or `ALTER TABLE`
- **Injection attacks** — No dynamic DDL construction
- **Privilege escalation** — Python services run with minimal database privileges (SELECT, INSERT, UPDATE, DELETE only)

---

## Process for Schema Changes

### 1. Design Phase

**Who:** Backend Engineer  
**Where:** `packages/db-tutorial/src/schema/`

Edit the Drizzle schema definition files:

```typescript
// packages/db-tutorial/src/schema/project-ai.ts
export const projectAiWorkflows = pgTable('project_ai_workflows', {
  workflowId: varchar('workflow_id', { length: 255 }).primaryKey(),
  currentState: varchar('current_state', { length: 100 }).notNull(),
  // ... add new columns here
});
```

### 2. Generate Migration

**Command:**
```bash
cd packages/db-tutorial
pnpm db:generate
```

**Output:** SQL migration file in `packages/db-tutorial/migrations/`

Example: `0028_cool_name.sql`

```sql
ALTER TABLE "project_ai_workflows" ADD COLUMN "new_field" varchar(255);
```

**Review:** Inspect the generated SQL to verify correctness. Drizzle generates idempotent, safe migrations.

### 3. Apply Migration (Development)

**Command:**
```bash
pnpm db:migrate
```

**Environment:** Uses `DATABASE_URL_TUTORIAL` from `.env` or environment variables.

**Verification:**
```bash
pnpm db:studio
# Opens Drizzle Studio to inspect schema visually
```

### 4. Update Python ORM Models (If Needed)

**Who:** Python Service Owner  
**Where:** `services/project-ai/app/persistence/models.py`

Update SQLAlchemy ORM models to **reflect** the schema change:

```python
class WorkflowModel(Base):
    __tablename__ = "project_ai_workflows"
    
    workflow_id = Column(String(255), primary_key=True)
    current_state = Column(String(100), nullable=False)
    new_field = Column(String(255), nullable=True)  # NEW: matches Drizzle schema
```

**Important:** This is **read-only mapping**, not schema definition. The Python model must match the Drizzle schema.

### 5. Test Migration

**Unit Tests:**
```bash
cd services/project-ai
pytest tests/unit/ -v
```

**Integration Tests (with real database):**
```bash
export TEST_DATABASE_URL_TUTORIAL="postgresql://localhost/tutorial_test"
pytest tests/integration/ -v
```

### 6. Commit and Deploy

**Files to commit:**
- `packages/db-tutorial/src/schema/*.ts` (Drizzle schema)
- `packages/db-tutorial/migrations/*.sql` (generated migration)
- `services/*/app/persistence/models.py` (Python ORM updates, if any)

**Deployment:** CI/CD pipeline runs `pnpm db:migrate` before deploying services.

---

## Forbidden Operations

### ❌ Never in Production Code

The following operations are **prohibited** in all service code (TypeScript and Python):

| Operation | Description | Why Forbidden |
|---|---|---|
| `Base.metadata.create_all()` | SQLAlchemy DDL creation | Bypasses Drizzle migration history |
| `Base.metadata.drop_all()` | SQLAlchemy DDL deletion | Data loss risk |
| `CREATE TABLE ...` | Raw SQL DDL | Bypasses version control |
| `ALTER TABLE ...` | Raw SQL DDL | Bypasses version control |
| `DROP TABLE ...` | Raw SQL DDL | Data loss risk |
| `alembic revision` | Alembic migration | Conflicts with Drizzle |
| `db.push()` | Prisma direct push | Bypasses migration history |

### ✅ Allowed Operations

Services may perform **DML (Data Manipulation Language)** operations:

| Operation | Description | Use Case |
|---|---|---|
| `SELECT` | Read data | All query operations |
| `INSERT` | Create records | Workflow creation, logging |
| `UPDATE` | Modify records | State transitions, updates |
| `DELETE` | Remove records | Cleanup, archival |
| Transactions | `BEGIN`, `COMMIT`, `ROLLBACK` | Atomic operations |

---

## Enforcement Mechanisms

### 1. Anti-DDL Test Suite

**Location:** `tests/unit/test_no_ddl.py`

**Tests:**
- `test_no_metadata_create_all_in_production_code` — Fails if `create_all()` found
- `test_no_raw_create_table_sql_in_production_code` — Fails if raw DDL found
- `test_no_alembic_imports_in_production_code` — Fails if Alembic imported
- `test_alembic_package_not_importable` — Fails if Alembic installed

**CI Integration:**
```bash
python -m pytest tests/unit/test_no_ddl.py -v
# Runs on every commit to catch violations
```

### 2. Code Review Checklist

All pull requests touching schema or database code must verify:

- [ ] Schema changes go through Drizzle `db:generate`
- [ ] Generated migration SQL reviewed for correctness
- [ ] Python ORM models updated to **match** schema (if applicable)
- [ ] No DDL operations in service code
- [ ] Anti-DDL tests pass
- [ ] Migration tested on staging environment

### 3. Database Privileges

Production database users for Python services have **limited privileges**:

```sql
-- Python service user privileges
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO python_service_user;
REVOKE CREATE ON SCHEMA public FROM python_service_user;
REVOKE DROP ON ALL TABLES IN SCHEMA public FROM python_service_user;
REVOKE ALTER ON ALL TABLES IN SCHEMA public FROM python_service_user;
```

This ensures that even if DDL code is accidentally deployed, it will **fail at runtime** due to insufficient privileges.

---

## Migration Workflow Examples

### Example 1: Add Column to Existing Table

**Scenario:** Add `priority` field to `project_ai_workflows` table.

**Steps:**

1. Edit Drizzle schema:
   ```typescript
   // packages/db-tutorial/src/schema/project-ai.ts
   export const projectAiWorkflows = pgTable('project_ai_workflows', {
     // ... existing fields
     priority: varchar('priority', { length: 50 }).default('normal'),
   });
   ```

2. Generate migration:
   ```bash
   cd packages/db-tutorial
   pnpm db:generate
   # Output: Created 0028_fierce_captain.sql
   ```

3. Review generated SQL:
   ```sql
   ALTER TABLE "project_ai_workflows" ADD COLUMN "priority" varchar(50) DEFAULT 'normal';
   ```

4. Apply migration:
   ```bash
   pnpm db:migrate
   ```

5. Update Python ORM (optional, if Python service needs to access `priority`):
   ```python
   # services/project-ai/app/persistence/models.py
   class WorkflowModel(Base):
       # ... existing fields
       priority = Column(String(50), nullable=False, default='normal')
   ```

6. Commit:
   ```bash
   git add packages/db-tutorial/src/schema/project-ai.ts
   git add packages/db-tutorial/migrations/0028_fierce_captain.sql
   git add services/project-ai/app/persistence/models.py
   git commit -m "feat: add priority field to workflows"
   ```

---

### Example 2: Create New Table

**Scenario:** Add `project_ai_audit_logs` table for compliance tracking.

**Steps:**

1. Define table in Drizzle schema:
   ```typescript
   // packages/db-tutorial/src/schema/project-ai.ts
   export const projectAiAuditLogs = pgTable('project_ai_audit_logs', {
     logId: varchar('log_id', { length: 255 }).primaryKey(),
     workflowId: varchar('workflow_id', { length: 255 }).notNull(),
     action: varchar('action', { length: 100 }).notNull(),
     timestamp: timestamp('timestamp').defaultNow().notNull(),
     metadata: jsonb('metadata').notNull(),
   });
   ```

2. Generate and apply migration:
   ```bash
   pnpm db:generate
   pnpm db:migrate
   ```

3. Create Python ORM model (if Python service needs to write logs):
   ```python
   # services/project-ai/app/persistence/models.py
   class AuditLogModel(Base):
       __tablename__ = "project_ai_audit_logs"
       
       log_id = Column(String(255), primary_key=True)
       workflow_id = Column(String(255), nullable=False)
       action = Column(String(100), nullable=False)
       timestamp = Column(DateTime, nullable=False, default=datetime.utcnow)
       metadata = Column(JSON, nullable=False)
   ```

4. Commit and deploy.

---

### Example 3: Rename Column (Breaking Change)

**Scenario:** Rename `requester_id` to `created_by` for consistency.

**Steps:**

1. Edit Drizzle schema:
   ```typescript
   export const projectAiWorkflows = pgTable('project_ai_workflows', {
     // OLD: requesterId: varchar('requester_id', { length: 255 }).notNull(),
     createdBy: varchar('created_by', { length: 255 }).notNull(),
   });
   ```

2. Generate migration:
   ```bash
   pnpm db:generate
   # Output: 0029_rename_requester_to_created_by.sql
   ```

3. Review generated SQL (Drizzle generates safe rename):
   ```sql
   ALTER TABLE "project_ai_workflows" RENAME COLUMN "requester_id" TO "created_by";
   ```

4. **IMPORTANT:** Update Python ORM **before** deploying migration:
   ```python
   class WorkflowModel(Base):
       # OLD: requester_id = Column(String(255), nullable=False)
       created_by = Column(String(255), nullable=False)
   ```

5. **Deployment Strategy (Zero-Downtime):**
   - Option A: Deploy code + migration together (requires downtime)
   - Option B: Add new column, backfill data, deprecate old column (multi-phase migration)

6. Commit and deploy with coordination.

---

## Drizzle Command Reference

| Command | Description |
|---|---|
| `pnpm db:generate` | Generate SQL migration from schema changes |
| `pnpm db:migrate` | Apply pending migrations to database |
| `pnpm db:studio` | Open Drizzle Studio (visual database explorer) |
| `pnpm db:push` | **❌ DO NOT USE** — Pushes schema without migrations |
| `pnpm db:drop` | **❌ DO NOT USE** — Drops database (data loss) |

**Production Deployment:**
```bash
# CI/CD pipeline should run:
pnpm --filter @quiz/db-tutorial db:migrate
```

---

## Troubleshooting

### Migration Fails with "Column Already Exists"

**Cause:** Migration already applied manually or by another tool.

**Solution:**
```bash
# Check migration history
psql $DATABASE_URL_TUTORIAL -c "SELECT * FROM drizzle_migrations ORDER BY created_at DESC LIMIT 10;"

# If migration was applied manually, mark it as completed without running:
# (Consult Drizzle documentation for migration table manipulation)
```

### Python ORM Model Out of Sync with Schema

**Symptom:** `Column 'xyz' does not exist` error at runtime.

**Solution:**
1. Check Drizzle schema in `packages/db-tutorial/src/schema/`
2. Update Python ORM model to **match** Drizzle definition
3. Do NOT run `create_all()` — the schema already exists, just update the model

### Developer Accidentally Runs `create_all()` Locally

**Symptom:** Anti-DDL tests fail.

**Solution:**
1. Remove `create_all()` call from code
2. Drop and recreate local database:
   ```bash
   psql -c "DROP DATABASE tutorial_dev;"
   psql -c "CREATE DATABASE tutorial_dev;"
   pnpm db:migrate
   ```
3. Re-run tests to verify cleanup

---

## Related Documentation

- **Drizzle ORM Documentation:** https://orm.drizzle.team/docs/overview
- **Project AI Persistence Layer:** `services/project-ai/README.md` (Section R3)
- **Anti-DDL Test Suite:** `tests/unit/test_no_ddl.py`
- **Security Audit:** `.agents/tasks/security-p1-migration-audit.md`

---

## Changelog

| Version | Date | Changes |
|---|---|---|
| 1.0 | 2026-10-09 | Initial policy documented after Alembic removal |

---

**Policy Owner:** Engineering Architecture Team  
**Review Cadence:** Quarterly or after major schema changes  
**Enforcement:** Automated (CI tests) + Code review
