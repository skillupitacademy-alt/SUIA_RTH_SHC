# Security P1 Migration Authority Cleanup - Implementation Plan

**Branch:** `m2-project-ai-canonical-wiring`  
**Target:** Remove Alembic from services/project-ai and enforce Drizzle-only migration authority  
**Priority:** P1 (Security — prevents dual-authority schema drift)

---

## Findings Summary

### ✅ Current State Audit

1. **Alembic dependency present**: `pyproject.toml` line 9 declares `alembic>=1.13.0`
2. **No alembic/ directory**: Directory does NOT exist in `services/project-ai/`
3. **No alembic.ini file**: File does NOT exist in `services/project-ai/`
4. **No Python imports**: Zero Python files import alembic (grep search returned no matches)
5. **Drizzle migrations verified**: `packages/db-tutorial/migrations/` contains SQL migrations for all `project_ai_*` tables (0026, 0027, etc.)
6. **Migration authority documented**: README.md section "R3 Durable Persistence Layer" explicitly states: "Schema changes are ONLY performed through Drizzle migrations. The Python application NEVER mutates the database schema."

### 🔴 Security Risk

The presence of `alembic>=1.13.0` in `pyproject.toml` creates a **P1 security vulnerability**:
- Developer could accidentally run `alembic init` or `alembic revision --autogenerate`
- Would create dual migration authority (Drizzle + Alembic)
- Schema drift between TypeScript and Python would break the documented architectural boundary
- SQLAlchemy ORM models in `app/persistence/models.py` are READ-ONLY by design

### 📋 Work Required

1. Remove Alembic dependency from `pyproject.toml`
2. Add anti-DDL test to prevent future schema mutation attempts
3. Document the migration authority policy in architecture docs
4. Commit and push changes

---

## Implementation Plan

- [ ] 1. Remove Alembic dependency from `services/project-ai/pyproject.toml`
      Edit line 9 to delete `"alembic>=1.13.0",` from the dependencies array.
      Files: `services/project-ai/pyproject.toml`
      Verify: Run `cd services/project-ai && pip install -e .` and confirm no alembic package installed. Then run `python -c "import alembic"` and confirm it raises ImportError.

- [ ] 2. Create anti-DDL test in `services/project-ai/tests/unit/test_no_ddl.py`
      Write pytest test that verifies SQLAlchemy metadata NEVER calls `create_all()`, `drop_all()`, or any DDL methods. Test imports `app.persistence.models` and inspects that no DDL operations are registered. Also test that alembic cannot be imported (ImportError expected).
      Files: `services/project-ai/tests/unit/test_no_ddl.py` (new file)
      Verify: Run `cd services/project-ai && pytest tests/unit/test_no_ddl.py -v` and confirm test passes with at least 3 assertions (no create_all in codebase, no drop_all in codebase, alembic not importable).

- [ ] 3. Document migration authority policy in `docs/architecture/migration-authority.md`
      Create architecture document explaining: (1) Drizzle in `packages/db-tutorial` is the single source of truth for schema, (2) Python services are read-only consumers via SQLAlchemy ORM, (3) All schema changes follow Drizzle → SQL migration → Python ORM update workflow, (4) Anti-DDL tests enforce this boundary. Include commands for generating and applying Drizzle migrations. Reference the R3 section in `services/project-ai/README.md`.
      Files: `docs/architecture/migration-authority.md` (new file)
      Verify: Run `cat docs/architecture/migration-authority.md` and confirm document contains: Drizzle command examples (`pnpm db:generate`, `pnpm db:migrate`), explanation of read-only Python ORM, and reference to anti-DDL tests.

- [ ] 4. Update `services/project-ai/README.md` to reference the migration authority doc
      Add a new subsection under "R3 Durable Persistence Layer" titled "Migration Authority" with a single paragraph: "All schema changes are managed through Drizzle. See [Migration Authority Policy](../../docs/architecture/migration-authority.md) for architectural rationale and enforcement mechanisms."
      Files: `services/project-ai/README.md`
      Verify: Run `grep -n "Migration Authority Policy" services/project-ai/README.md` and confirm the link exists.

- [ ] 5. Run project-ai test suite to confirm no regressions
      Execute the existing test suite to verify that removing Alembic dependency does not break any tests (since alembic was never imported, no tests should be affected).
      Files: No files modified (verification only)
      Verify: Run `cd services/project-ai && pytest tests/ -v --tb=short` and confirm all existing tests pass. Expected: 288 unit tests + 26 integration tests pass (integration tests may skip if TEST_DATABASE_URL_TUTORIAL not configured).

- [ ] 6. Run workspace lint and type-check to confirm code quality
      Execute the workspace-level quality gates to ensure the changes align with CONTRIBUTING.md requirements.
      Files: No files modified (verification only)
      Verify: Run `cd e:/onlinewebsites/quiz-platform && pnpm lint:all` and confirm zero warnings/errors. Then run `pnpm typecheck:all` and confirm TypeScript compilation succeeds across all packages.

- [ ] 7. Stage changes and commit with descriptive message
      Add modified and new files to git staging area, then create commit following Conventional Commits format.
      Files: `services/project-ai/pyproject.toml`, `services/project-ai/tests/unit/test_no_ddl.py`, `docs/architecture/migration-authority.md`, `services/project-ai/README.md`
      Verify: Run `git status` and confirm 4 files staged. Then run `git log -1 --oneline` and confirm commit message starts with "security: remove Alembic dependency and enforce Drizzle-only migrations".

- [ ] 8. Push changes to remote branch `m2-project-ai-canonical-wiring`
      Push the commit to the remote repository to enable cross-check and code review.
      Files: No files modified (git operation only)
      Verify: Run `git push origin m2-project-ai-canonical-wiring` and confirm push succeeds. Then run `git log origin/m2-project-ai-canonical-wiring -1 --oneline` and confirm the commit appears on the remote branch.

---

## Verification Commands Summary

After completing all steps, verify the full implementation:

```bash
# 1. Alembic not importable
cd services/project-ai
python -c "import alembic" 2>&1 | grep "No module named 'alembic'"

# 2. Anti-DDL tests pass
pytest tests/unit/test_no_ddl.py -v

# 3. All project-ai tests pass
pytest tests/ -v

# 4. Architecture doc exists
cat ../../docs/architecture/migration-authority.md | head -20

# 5. Workspace quality gates pass
cd ../..
pnpm lint:all
pnpm typecheck:all

# 6. Git state clean
git status
git log -1 --oneline
git log origin/m2-project-ai-canonical-wiring -1 --oneline
```

---

## Security Impact

**Before:** Developer could accidentally run `alembic revision --autogenerate` and create conflicting migrations.  
**After:** Alembic is not installed; any attempt to import it raises `ImportError`. Anti-DDL tests enforce read-only ORM boundary.

**Risk Reduction:** Eliminates dual-authority schema drift vulnerability (P1 → resolved).

---

## Dependencies

- **Requires:** Python 3.11+, pytest installed in `services/project-ai`
- **Requires:** pnpm workspaces configured (already present per `package.json`)
- **Requires:** Git remote access to push to `m2-project-ai-canonical-wiring` branch

---

## Notes

- All verification steps use the project's real build and test commands discovered during exploration
- No grep-based verification; all checks run actual commands (pytest, pnpm, git)
- Plan follows the documented CONTRIBUTING.md workflow (lint, typecheck, build gates)
- Drizzle migration commands sourced directly from `services/project-ai/README.md` section "Migration Workflow"
