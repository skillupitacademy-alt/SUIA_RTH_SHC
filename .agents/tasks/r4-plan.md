# M2.9 R4 - Contract API & Auth Layer Implementation Plan

## Context

R4 builds the Contract API and authorization layer on top of R1-R3 foundations:
- **R1**: Repository intelligence consolidated
- **R2**: Contracts fully repository-derived with evidence tracking
- **R3**: Durable PostgreSQL persistence with 6 `project_ai_*` tables

This plan adds RESTful Contract API endpoints with JWT-based authentication and role-based access control (RBAC) required for W3+ waves.

## Exploration Findings

### Current State
- **Existing auth**: Placeholder `verify_auth()` in `contract.py` accepts any Bearer token ≥8 chars and generates user ID
- **No JWT library**: `pyproject.toml` has no JWT dependencies (python-jose, PyJWT, etc.)
- **No rate limiting**: No slowapi or rate limiting infrastructure
- **No auth middleware**: No app/auth/, app/middleware/ directories
- **Repository pattern**: Well-established with `Depends(get_contract_repository)` injection
- **PostgreSQL backing**: ContractRepository with automatic hash verification
- **Test infrastructure**: pytest with async fixtures (test_db_session, test_contract_repo in conftest.py)
- **Integration tests**: Exist in tests/integration/ with real PostgreSQL patterns
- **seal_contract()**: R2 function in app/contracts/engineering_contract.py
- **ContractFieldEvidence**: R2 model in app/contracts/repository_intelligence.py for evidence tracking

### Architecture Decisions

1. **JWT Library**: Add `python-jose[cryptography]` — FastAPI docs standard, widely used
2. **Rate Limiting**: Add `slowapi` — FastAPI-compatible rate limiter
3. **Auth Module**: Create `app/auth/` with jwt.py (token ops) and dependencies.py (RBAC)
4. **Middleware**: Auth middleware in main.py (not a separate middleware/ dir) — simpler for this scope
5. **No new tables**: No token revocation table (out of scope for R4) — stateless JWT
6. **Migration authority**: Drizzle (from FEAT-000 discovery) — any schema change must go through Drizzle, NOT create_all()
7. **Test split**: Unit tests (mocked repo) in tests/unit/, integration tests (real PostgreSQL) in tests/integration/

## Implementation Plan

- [ ] 1. **Add JWT and rate limiting dependencies to pyproject.toml**
      Add `python-jose[cryptography]>=3.3.0` and `slowapi>=0.1.9` to dependencies array.
      Files: e:\onlinewebsites\quiz-platform\services\project-ai\pyproject.toml
      Verify: `cd e:\onlinewebsites\quiz-platform\services\project-ai && pip install -e .` succeeds and imports work

- [ ] 2. **Create JWT authentication module (app/auth/jwt.py)**
      Implement `create_access_token(data: dict, secret_key: str, algorithm: str, expires_delta: timedelta)` -> str
      Implement `decode_access_token(token: str, secret_key: str, algorithm: str)` -> dict (raises HTTPException 401 on invalid/expired)
      Use jose.jwt for encode/decode, handle expiration with datetime + timedelta.
      Files: e:\onlinewebsites\quiz-platform\services\project-ai\app\auth\jwt.py (create), e:\onlinewebsites\quiz-platform\services\project-ai\app\auth\__init__.py (create)
      Verify: Unit tests in tests/unit/test_auth_jwt.py pass (valid token, expired token, invalid signature)

- [ ] 3. **Create RBAC dependency injection module (app/auth/dependencies.py)**
      Implement `get_current_user(authorization: str = Header(...))` -> dict with {user_id, roles} using decode_access_token()
      Implement role checkers: `require_contract_admin(user: dict = Depends(get_current_user))`, `require_contract_reviewer(user: dict = Depends(get_current_user))`, `require_contract_viewer(user: dict = Depends(get_current_user))`
      Role hierarchy: admin ⊃ reviewer ⊃ viewer (admin can do reviewer tasks, etc.)
      Raise HTTPException 403 if role missing.
      Files: e:\onlinewebsites\quiz-platform\services\project-ai\app\auth\dependencies.py (create)
      Verify: Unit tests in tests/unit/test_auth_dependencies.py pass (valid role, missing role, invalid token)

- [ ] 4. **Add environment variable configuration for JWT secrets**
      Read JWT_SECRET_KEY (required, fail startup if missing), JWT_ALGORITHM (default: HS256), JWT_ACCESS_TOKEN_EXPIRE_MINUTES (default: 30) from environment.
      Add validation in app/main.py lifespan startup: check JWT_SECRET_KEY is set and ≥32 chars.
      Files: e:\onlinewebsites\quiz-platform\services\project-ai\app\auth\config.py (create), e:\onlinewebsites\quiz-platform\services\project-ai\app\main.py (modify lifespan)
      Verify: Starting app without JWT_SECRET_KEY fails with clear error; with valid JWT_SECRET_KEY succeeds

- [ ] 5. **Expand contract routes with full CRUD API (app/api/routes/contract.py)**
      Add POST /api/v1/contracts/ (create from snapshot, requires contract_admin)
      Add GET /api/v1/contracts/{contract_id} (retrieve by ID, requires contract_viewer)
      Add GET /api/v1/contracts/ (list with pagination/filtering, requires contract_viewer)
      Add PUT /api/v1/contracts/{contract_id} (update, requires contract_admin) — note: contracts are immutable after sealing, so only allow updates if not sealed
      Add DELETE /api/v1/contracts/{contract_id} (delete, requires contract_admin)
      Add POST /api/v1/contracts/{contract_id}/seal (seal contract, requires contract_reviewer, calls seal_contract() from R2)
      Add GET /api/v1/contracts/{contract_id}/evidence (get field evidence, requires contract_viewer, returns ContractFieldEvidence from R2)
      Use Depends() for ContractRepository and RBAC dependencies.
      All endpoints must call session.commit() after repository operations.
      Files: e:\onlinewebsites\quiz-platform\services\project-ai\app\api\routes\contract.py (expand existing routes)
      Verify: Unit tests for each endpoint with mocked repo in tests/unit/test_contract_api.py

- [ ] 6. **Add rate limiting to contract endpoints**
      Install slowapi and add rate limiter instance in main.py: `limiter = Limiter(key_func=get_remote_address)` with state=RateLimitMiddleware
      Add @limiter.limit("100/minute") decorator to all contract API endpoints (6 endpoints from step 5 + 2 existing).
      Add rate limit exception handler in main.py to return 429 with Retry-After header.
      Files: e:\onlinewebsites\quiz-platform\services\project-ai\app\main.py (add limiter), e:\onlinewebsites\quiz-platform\services\project-ai\app\api\routes\contract.py (add decorators)
      Verify: Integration test in tests/integration/test_rate_limiting.py that makes 101 requests and confirms 101st returns 429

- [ ] 7. **Write unit tests for Contract API endpoints**
      Create tests/unit/test_contract_api.py with mocked ContractRepository and auth dependencies.
      Test each endpoint: success cases, auth failures (401, 403), validation failures (400), not found (404).
      Mock seal_contract() and ContractFieldEvidence retrieval.
      Use pytest fixtures from conftest.py (mock_db_session).
      Minimum 20 tests covering all 8 endpoints (7 new + 1 existing) × 3 cases (success, auth, validation).
      Files: e:\onlinewebsites\quiz-platform\services\project-ai\tests\unit\test_contract_api.py (create)
      Verify: `cd e:\onlinewebsites\quiz-platform\services\project-ai && python -m pytest tests/unit/test_contract_api.py -v` passes all tests

- [ ] 8. **Write integration tests for Contract API with real PostgreSQL**
      Create tests/integration/test_contract_api_integration.py with test_db_session fixture.
      Test full CRUD lifecycle: create contract → retrieve → seal → get evidence → delete.
      Test hash verification on retrieve (use ContractRepository hash verification from R3).
      Test optimistic locking (concurrent updates).
      Test role-based access (valid JWT with different roles).
      Minimum 8 integration tests covering full API surface with real database.
      Files: e:\onlinewebsites\quiz-platform\services\project-ai\tests\integration\test_contract_api_integration.py (create)
      Verify: `cd e:\onlinewebsites\quiz-platform\services\project-ai && python -m pytest tests/integration/test_contract_api_integration.py -v` passes all tests

- [ ] 9. **Add auth and RBAC tests (unit + integration)**
      Unit tests in tests/unit/test_auth_jwt.py: token creation, decode, expiration, invalid signature.
      Unit tests in tests/unit/test_auth_dependencies.py: role checks, missing roles, invalid tokens.
      Integration tests in tests/integration/test_auth_flow.py: end-to-end auth flow (login → get token → call protected endpoint → verify RBAC).
      Minimum 12 auth tests (6 unit + 6 integration).
      Files: tests/unit/test_auth_jwt.py (create), tests/unit/test_auth_dependencies.py (create), tests/integration/test_auth_flow.py (create)
      Verify: `cd e:\onlinewebsites\quiz-platform\services\project-ai && python -m pytest tests/unit/test_auth*.py tests/integration/test_auth*.py -v` passes all tests

- [ ] 10. **Update API documentation and OpenAPI schema**
      Add OpenAPI security scheme for JWT Bearer tokens in main.py FastAPI app: `security_scheme = {"Bearer": {"type": "http", "scheme": "bearer", "bearerFormat": "JWT"}}`
      Add security requirements to contract endpoints: `dependencies=[Security(get_current_user)]` or document with OpenAPI tags.
      Update endpoint docstrings with auth requirements (roles needed, JWT format).
      Files: e:\onlinewebsites\quiz-platform\services\project-ai\app\main.py (add security scheme), e:\onlinewebsites\quiz-platform\services\project-ai\app\api\routes\contract.py (docstrings)
      Verify: Navigate to http://localhost:8000/docs and confirm JWT auth UI appears, all contract endpoints show lock icon, role requirements in descriptions

## Verification Strategy

1. **Unit tests**: Mock all external dependencies (ContractRepository, database session, JWT decode). Fast, isolated.
2. **Integration tests**: Use test_db_session fixture with real PostgreSQL (in-memory SQLite for fast tests, or TEST_DATABASE_URL_TUTORIAL for real PostgreSQL). Tests full stack including database, auth, rate limiting.
3. **Manual verification**: Start service with `uvicorn app.main:app --reload`, use /docs to test JWT auth and RBAC interactively.
4. **Full test suite**: `python -m pytest tests/ -v` must pass (unit + integration).

## Risk Assessment

### Risks
1. **JWT secret management**: JWT_SECRET_KEY must be secure in production (not hardcoded, not in repo).
   - Mitigation: Require env var, fail startup if missing or weak, document in README.
2. **Token revocation**: Stateless JWT means no revocation (logout doesn't invalidate token until expiry).
   - Mitigation: Short expiry (30 min default), note in docs. Full revocation requires database table (defer to future work).
3. **Rate limiting accuracy**: slowapi uses IP address, can be bypassed with proxies.
   - Mitigation: Document limitation, consider X-Forwarded-For in production config (out of scope for R4).
4. **PostgreSQL dependency**: Integration tests require DATABASE_URL_TUTORIAL or in-memory SQLite.
   - Mitigation: conftest.py uses SQLite by default, real PostgreSQL opt-in via env var.

### Open Questions
1. **Login endpoint**: R4 spec doesn't mention login/token issuance endpoint. Assume external auth service or add stub?
   - Decision: Add stub POST /api/v1/auth/login endpoint that issues JWT for testing. Production integrates with real auth service.
2. **Role assignment**: How do users get roles (contract_admin, contract_reviewer, etc.)?
   - Decision: Roles embedded in JWT claims during token issuance. R4 doesn't implement user/role management (defer to future work).

## Migration Notes

**No schema changes required for R4**. All authentication is stateless JWT (no token table). Contracts already in `project_ai_contracts` table from R3. If token revocation is added later, new table `project_ai_tokens` would be required and MUST go through Drizzle migration (never create_all()).

## Dependencies on R1-R3

- **R1**: Repository intelligence provides snapshot data for contracts
- **R2**: `seal_contract()` function and `ContractFieldEvidence` model used in seal endpoint
- **R3**: `ContractRepository` with PostgreSQL backing and hash verification used in all CRUD operations

## Success Criteria

- [ ] All 10 implementation steps complete
- [ ] Minimum 40 tests pass (20 unit + 12 auth + 8 integration)
- [ ] `python -m pytest tests/ -v` returns 0 failures
- [ ] Service starts with valid JWT_SECRET_KEY, fails without
- [ ] /docs shows JWT auth UI with Bearer token input
- [ ] Rate limiting works (101st request returns 429)
- [ ] All CRUD operations work with correct roles
- [ ] Hash verification prevents tampered contracts from being retrieved
- [ ] No schema changes (no create_all(), no new tables)

## Estimated Effort

**Total**: 8-12 hours
- Steps 1-4 (auth foundation): 3-4 hours
- Step 5 (API expansion): 2-3 hours
- Step 6 (rate limiting): 1 hour
- Steps 7-9 (tests): 3-4 hours
- Step 10 (docs): 1 hour
