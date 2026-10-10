# Gate D — PostgreSQL Integration Test Infrastructure

## Task Overview

Create PostgreSQL integration test infrastructure for the project-ai service, enabling real database testing of security contracts (RBAC, brand isolation, identity extraction) and workflow state management.

## Context

**Service:** `services/project-ai` (Python FastAPI)  
**Database:** PostgreSQL via SQLAlchemy + asyncpg  
**Test Framework:** pytest with pytest-asyncio  
**Existing Infrastructure:** Integration test fixtures in `tests/integration/conftest.py`, persistence layer in `app/persistence/`, security authorization in `app/auth/`

**Key Findings from Exploration:**
- Integration test fixtures already configured with TEST_DATABASE_URL_TUTORIAL safety checks
- 10+ @pytest.mark.skip decorators in tests/security/test_authorization.py waiting for database
- No docker-compose test database configuration exists
- No .env.test.example documenting test database connection
- Existing pattern: test_repositories_integration.py with 17 integration tests using real PostgreSQL

## Implementation Plan

### - [ ] 1. Create Docker Compose Test Database Configuration

Create `services/project-ai/docker-compose.test-db.yml` with:
- **Image:** postgres:17
- **Container name:** project-ai-test-db
- **Port mapping:** 55432:5432 (avoids conflict with host PostgreSQL on 5432)
- **Storage:** tmpfs mount at `/var/lib/postgresql/data` for ephemeral data and fast I/O
- **Healthcheck:** `pg_isready -U test_user` with 5s interval, 3 retries
- **Environment:**
  - POSTGRES_DB=tutorial_test
  - POSTGRES_USER=test_user
  - POSTGRES_PASSWORD=test_password
  - POSTGRES_HOST_AUTH_METHOD=trust

**Files:** `services/project-ai/docker-compose.test-db.yml`

**Verify:** 
```bash
docker-compose -f services/project-ai/docker-compose.test-db.yml up -d
docker-compose -f services/project-ai/docker-compose.test-db.yml ps  # Shows healthy status
docker exec project-ai-test-db pg_isready -U test_user  # Returns "accepting connections"
```

### - [ ] 2. Create Test Environment Configuration Template

Create `services/project-ai/.env.test.example` based on `.env.example` pattern:
- **TEST_DATABASE_URL_TUTORIAL:** `postgresql+asyncpg://test_user:test_password@localhost:55432/tutorial_test`
- **JWT_SECRET:** Test value (minimum 32 characters)
- **ADMIN_JWT_SECRET:** Test value (minimum 32 characters)
- **Comments:** Explain each variable and note to copy to `.env.test` for local use

**Files:** `services/project-ai/.env.test.example`

**Verify:**
```bash
cat services/project-ai/.env.test.example  # Confirms TEST_DATABASE_URL_TUTORIAL variable exists
```

### - [ ] 3. Implement RBAC Integration Tests (10 tests)

Create `tests/integration/test_security_integration.py` with 10 RBAC tests:
1. **test_contract_admin_can_create_workflow** — Verify `require_role(principal, 'contract_admin')` allows workflow creation
2. **test_contract_viewer_denied_workflow_creation** — Verify 403 raised for viewer role
3. **test_super_admin_bypasses_rbac** — Verify `is_super_admin()` returns True and bypasses checks
4. **test_infrastructure_portal_identity_bypasses_rbac** — Verify `portal_identity='infrastructure'` bypasses
5. **test_empty_roles_denies_privileged_operations** — Verify `roles=[]` raises 403
6. **test_case_insensitive_role_matching** — Verify 'Contract_Admin' matches 'contract_admin'
7. **test_contract_reviewer_read_only** — Verify can list but not create
8. **test_require_any_role_accepts_multiple** — Verify `require_any_role(['contract_admin', 'contract_reviewer'])` accepts either
9. **test_admin_token_type_with_contract_admin_role** — Verify `tokenType='admin'` + role allowed
10. **test_rbac_denial_logs_warning** — Verify authorization failure logged at WARNING level

**Pattern:** Use `@pytest.mark.integration`, `@pytest.mark.asyncio`, `db_session`, `workflow_repo` fixtures from conftest.py. Follow test_repositories_integration.py structure.

**Files:** `tests/integration/test_security_integration.py`

**Verify:**
```bash
pytest tests/integration/test_security_integration.py::test_contract_admin_can_create_workflow -v
pytest tests/integration/test_security_integration.py -v -k rbac  # All 10 RBAC tests pass
```

### - [ ] 4. Implement Brand Isolation Integration Tests (5 tests)

Add to `tests/integration/test_security_integration.py`:
1. **test_same_brand_workflow_access_allowed** — Create workflow with brand='skillhub', verify user with same brand can access via `verify_brand_access()`
2. **test_cross_brand_workflow_access_denied** — Verify user brand='techskills' cannot access workflow brand='skillhub', raises 403
3. **test_infrastructure_user_cross_brand_bypass** — Verify user with brand=None can access any workflow brand
4. **test_brand_none_resource_requires_infrastructure** — Verify resource with brand=None denies regular users, allows infrastructure users
5. **test_candidate_upload_captures_requester_brand** — Create candidate with user brand, verify brand persisted

**Files:** `tests/integration/test_security_integration.py`

**Verify:**
```bash
pytest tests/integration/test_security_integration.py -v -k brand  # All 5 brand tests pass
```

### - [ ] 5. Implement Identity Extraction Integration Tests (5 tests)

Add to `tests/integration/test_security_integration.py`:
1. **test_user_id_extracted_from_jwt** — Verify `get_current_user()` extracts `user_id` claim
2. **test_original_user_id_extraction** — Verify `originalUserId` claim maps to `original_user_id` field
3. **test_shadow_user_id_extraction** — Verify `shadowUserId` claim extracted for admin impersonation
4. **test_client_supplied_user_id_ignored** — Verify route handler uses `principal['user_id']` from JWT, not request body
5. **test_missing_user_id_claim_rejected** — Verify JWT without `user_id` claim raises 401

**Files:** `tests/integration/test_security_integration.py`

**Verify:**
```bash
pytest tests/integration/test_security_integration.py -v -k identity  # All 5 identity tests pass
```

### - [ ] 6. Implement State Machine Integration Tests (5 tests)

Add to `tests/integration/test_security_integration.py`:
1. **test_workflow_creation_initial_state** — Create workflow via `workflow_repo`, verify `current_state='REQUESTED'`
2. **test_state_transition_recorded** — Create `StateTransitionModel`, verify `from_state` and `to_state` persisted
3. **test_approval_transitions_to_implementing** — Create workflow in `AWAITING_IMPLEMENTATION_APPROVAL`, approve, verify state='IMPLEMENTING'
4. **test_reject_transitions_to_rejected** — Reject workflow, verify state='REJECTED'
5. **test_invalid_state_transition_prevented** — Attempt transition from wrong state, verify prevented

**Files:** `tests/integration/test_security_integration.py`

**Verify:**
```bash
pytest tests/integration/test_security_integration.py -v -k state  # All 5 state tests pass
```

### - [ ] 7. Implement W3/W5 Workflow Security Integration Tests (5 tests)

Add to `tests/integration/test_security_integration.py`:
1. **test_candidate_validator_hash_verification** — Upload candidate, verify SHA-256 computed from file content
2. **test_canonical_comparator_brand_independence_check** — Run comparison, verify hardcoded brand markers flagged
3. **test_placement_manifest_sealed_with_hash** — Generate manifest, verify `manifest_sha256` populated
4. **test_placement_approval_requires_contract_admin** — Attempt placement without role, verify 403
5. **test_placement_manifest_tamper_detection** — Modify manifest, verify hash verification detects tampering

**Files:** `tests/integration/test_security_integration.py`

**Verify:**
```bash
pytest tests/integration/test_security_integration.py -v -k workflow  # All 5 workflow tests pass
```

### - [ ] 8. Remove @pytest.mark.skip Decorators from Security Tests

Update `tests/security/test_authorization.py`:
- Remove `@pytest.mark.skip` decorators from lines 192, 203, 213, 400, 410, 420, 430, 440, 463, 473
- Convert placeholder `pass` statements to real integration tests using `db_session` fixture
- Follow pattern from `test_repositories_integration.py`

**Affected tests:**
- test_approver_identity_extraction_from_jwt (line 192)
- test_requester_identity_extraction_from_jwt (line 203)
- test_client_supplied_user_id_ignored (line 213)
- test_candidate_upload_captures_brand (line 400)
- test_candidate_execute_same_brand_succeeds (line 410)
- test_candidate_execute_cross_brand_denied (line 420)
- test_candidate_execute_infrastructure_bypass (line 430)
- test_null_brand_candidate_requires_privileged_role (line 440)
- test_same_brand_workflow_approval_succeeds (line 463)
- test_infrastructure_user_cross_brand_access_succeeds (line 473)

**Files:** `tests/security/test_authorization.py`

**Verify:**
```bash
pytest tests/security/test_authorization.py -v -k "jwt or client_supplied or brand"  # No skips, tests pass
grep -c "@pytest.mark.skip" tests/security/test_authorization.py  # Reduced count
```

### - [ ] 9. Update README.md with Integration Test Documentation

Add section after "## Testing" in `services/project-ai/README.md`:

**Content:**
```markdown
### Running Integration Tests

Integration tests require a PostgreSQL database. Use Docker Compose for local testing:

#### Prerequisites
- Docker and Docker Compose
- PostgreSQL client tools (optional, for verification)

#### Start Test Database
```bash
docker-compose -f services/project-ai/docker-compose.test-db.yml up -d
```

#### Configure Environment
```bash
cp .env.test.example .env.test
# Edit .env.test if needed (defaults work for docker-compose setup)
```

#### Run Integration Tests
```bash
# All integration tests
pytest tests/integration/ -v

# Specific test categories
pytest tests/integration/test_security_integration.py -v  # Security tests
pytest tests/integration/test_repositories_integration.py -v  # Repository tests
```

#### Stop Test Database
```bash
docker-compose -f services/project-ai/docker-compose.test-db.yml down
```

**Note:** Integration tests skip gracefully if `TEST_DATABASE_URL_TUTORIAL` is not configured.
```

**Files:** `services/project-ai/README.md`

**Verify:**
```bash
grep -A 10 "Running Integration Tests" services/project-ai/README.md  # Section exists with commands
```

### - [ ] 10. Create CI Configuration Documentation

Create `.agents/tasks/gate-d-ci-setup.md` documenting GitHub Actions configuration:

**Content structure:**
1. **Overview:** PostgreSQL integration tests in CI pipelines
2. **GitHub Actions Service Container:** postgres:17 with healthcheck
3. **Environment Variables:** TEST_DATABASE_URL_TUTORIAL, JWT_SECRET, ADMIN_JWT_SECRET
4. **Migration Prerequisite:** Drizzle migrations must run before pytest
5. **Example Workflow YAML:** Complete service container configuration
6. **Local Development:** Reference to docker-compose.test-db.yml

**Key details:**
- CI uses port 5432 (no conflict in clean container)
- Local uses port 55432 (avoids host PostgreSQL)
- Service container pattern with `postgres:17` image
- Health check ensures database ready before tests

**Files:** `.agents/tasks/gate-d-ci-setup.md`

**Verify:**
```bash
cat .agents/tasks/gate-d-ci-setup.md  # Shows GitHub Actions postgres service configuration
```

## Summary

This plan creates complete PostgreSQL integration test infrastructure:

**Infrastructure (FEAT-001):**
- docker-compose.test-db.yml for local testing
- .env.test.example documenting configuration

**Tests (FEAT-002):**
- 30 integration tests in test_security_integration.py
- 10 converted tests in test_authorization.py (remove @pytest.mark.skip)
- Coverage: RBAC (10), Brand Isolation (5), Identity (5), State Machine (5), W3/W5 (5)

**Documentation (FEAT-003):**
- README.md with local testing instructions
- gate-d-ci-setup.md with CI configuration
- gate-d-plan.md (this file) with implementation details

**Verification Strategy:**
- Each step includes specific pytest commands
- Docker Compose healthcheck ensures database ready
- Tests skip gracefully when database not configured
- All tests use real PostgreSQL (no SQLite fallback)

**Migration Approach:**
- Schema managed by Drizzle migrations (TypeScript)
- Python application never mutates schema
- Tests assume project_ai_* tables exist
- Conftest.py validates table existence at test startup
