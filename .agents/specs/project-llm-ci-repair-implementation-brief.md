# Project LLM E2E Implementation - CI Repair Multi-Agent Workflow

## Context

**Repository**: skillupitacademy-alt/SUIA_RTH_SHC  
**Branch**: `project-llm-e2e-implementation`  
**PR**: #24 - "M2.9: Wire Project LLM external-AI workflow safeguards"  
**Base Branch**: `m2-project-ai-canonical-wiring`  
**Latest Commit**: 5872b981 (fix(db): avoid recreating existing assignment help enum)  
**CI Status**: FAILURE - PostgreSQL Integration Tests  
**CI Run**: https://github.com/skillupitacademy-alt/SUIA_RTH_SHC/actions/runs/38071293384

## Ground Truth - Verified CI Failure

```
DrizzleQueryError: Failed query: 
CREATE TYPE "public"."assignment_progress_status" AS ENUM('not_started', 'in_progress', 'self_completed');

cause: error: type "assignment_progress_status" already exists
SQLSTATE: 42710
```

**Root Cause**: The enum `assignment_progress_status` is defined in BOTH:
1. `packages/db-tutorial/migrations/0003_flawless_surge.sql` (earlier migration)
2. `packages/db-tutorial/migrations/0012_futuristic_pepper_potts.sql` (newer migration - Line 11)

The previous fix (5872b981) only removed duplicate `assignment_help_request_status` but missed `assignment_progress_status`.

## Files Changed in PR #24

1. `.github/workflows/integration-tests.yml` - CI workflow configuration
2. `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/candidate-upload/page.tsx`
3. `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/context/ProjectLlmContext.tsx`
4. `apps/skillhubcore-admin/src/app/(admin)/tools/project-llm/external-ai-handoff/page.tsx`
5. `packages/db-tutorial/migrations/0012_futuristic_pepper_potts.sql` - **Contains duplicate enum**
6. `services/project-ai/README.md`
7. `services/project-ai/app/main.py`
8. `services/project-ai/app/orchestration/agent_coordinator.py`
9. `services/project-ai/app/verification/browser.py`
10. `services/project-ai/app/verification/runtime.py`
11. `services/project-ai/tests/test_agent_coordinator.py`
12. `services/project-ai/tests/verification/test_runtime.py`

**Total**: 12 files, +333/-148 lines

## Implementation Strategy

### Gate A: Investigation & Baseline
**Agent**: investigator  
**Goal**: Verify root cause, document all duplicate enums, check migration dependencies

**Tasks**:
1. Confirm `assignment_progress_status` exists in migrations 0003 and 0012
2. Check for any OTHER duplicate enums between these migrations
3. Verify migration order and dependencies
4. Document baseline commit SHA and CI failure details
5. Save findings to `.agents/evidence/project-llm-ci-investigation.md`

### Gate B: Fix Implementation
**Agent**: coder  
**Goal**: Remove duplicate enum CREATE TYPE statement from migration 0012

**Tasks**:
1. Read `packages/db-tutorial/migrations/0012_futuristic_pepper_potts.sql`
2. Remove line 11: `CREATE TYPE "public"."assignment_progress_status" AS ENUM('not_started', 'in_progress', 'self_completed');--> statement-breakpoint`
3. Verify the enum is still present in migration 0003 (DO NOT REMOVE from there)
4. Verify all references to this enum type still work (tables using this type)
5. Commit fix with message: `fix(db): remove duplicate assignment_progress_status enum from migration 0012`

**One-Writer-At-A-Time Rule**: Only modify `0012_futuristic_pepper_potts.sql`. Do NOT touch `0003_flawless_surge.sql`.

### Gate C: Local Verification
**Agent**: verifier  
**Goal**: Run full CI workflow locally to confirm fix

**Tasks**:
1. Set up local PostgreSQL test database
2. Run Drizzle migrations: `cd packages/db-tutorial && pnpm db:migrate`
3. Run integration tests: `cd services/project-ai && pytest tests/integration/ -v --tb=short`
4. Run security tests: `pytest tests/security/test_authorization.py -v -k integration --tb=short`
5. Capture full test output to `.agents/evidence/project-llm-ci-verification-output.txt`
6. Save test results summary to `.agents/evidence/project-llm-ci-verification-results.json`

**Success Criteria**:
- All Drizzle migrations complete without SQLSTATE 42710 errors
- Integration tests pass
- Security tests pass

### Gate D: Evidence Collection
**Agent**: evidence-collector  
**Goal**: Bundle all artifacts for PR review

**Tasks**:
1. Collect investigation findings
2. Collect verification logs and test results
3. Create evidence manifest showing before/after state
4. Document commit SHAs (baseline → fix)
5. Save to `.agents/evidence/project-llm-ci-fix-certification.md`

### Gate E: Push & PR Update
**Agent**: git-operator  
**Goal**: Push fix to branch and update PR

**Tasks**:
1. Push commit to `project-llm-e2e-implementation` branch
2. Monitor GitHub Actions CI run
3. Capture CI run URL and status
4. Update `.agents/evidence/` with CI results link
5. Comment on PR #24 with fix summary and evidence links

## Environment Configuration

### CI Environment (from `.github/workflows/integration-tests.yml`):
```yaml
services:
  postgres:
    image: postgres:17
    env:
      POSTGRES_DB: tutorial_test
      POSTGRES_USER: test_user
      POSTGRES_PASSWORD: test_password
    ports:
      - 5432:5432

env:
  DATABASE_URL: postgresql://test_user:test_password@localhost:5432/tutorial_test
  TEST_DATABASE_URL_TUTORIAL: postgresql+asyncpg://test_user:test_password@localhost:5432/tutorial_test
  JWT_SECRET: test_jwt_secret_minimum_32_characters_long_value
  ADMIN_JWT_SECRET: test_admin_jwt_secret_minimum_32_characters
```

### Migration Commands:
```bash
cd packages/db-tutorial
pnpm db:migrate  # Uses drizzle.config.ts with DATABASE_URL env var
```

### Test Commands:
```bash
cd services/project-ai
pytest tests/integration/ -v --tb=short
pytest tests/security/test_authorization.py -v -k integration --tb=short
```

## Success Metrics

- ✅ Zero SQLSTATE 42710 duplicate enum errors
- ✅ All Drizzle migrations execute cleanly
- ✅ Integration tests pass
- ✅ Security tests pass
- ✅ GitHub Actions CI passes
- ✅ Evidence bundle complete in `.agents/evidence/`

## Evidence-Beats-Claims Principle

Every gate must produce verifiable artifacts:
- Gate A: Investigation findings with exact line numbers and file paths
- Gate B: Git diff showing exact lines removed
- Gate C: Full test output logs showing PASS status
- Gate D: Evidence manifest with commit SHAs and timestamps
- Gate E: GitHub Actions CI run URL showing green checkmarks

## One-Writer-At-A-Time Rule

Only ONE file modified per gate:
- Gate B modifies ONLY `packages/db-tutorial/migrations/0012_futuristic_pepper_potts.sql`
- No other migrations touched
- No schema files modified
- No table definitions changed

## Approval Gates

**Human approval required after**:
- Gate B (review fix before verification)
- Gate C (review verification results before push)
- Gate E (confirm CI pass before closing)

## Reference Materials

Based on successful quiz-platform Gates A-G methodology:
- `.agents/evidence/production-ready/` - 67 certified evidence files
- `.agents/tasks/gate-g-final-report.md` - Complete methodology
- All gate-specific reports in `.agents/tasks/`
