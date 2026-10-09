# Implementation Plan: Python JWT Verifier for project-ai Service

**Branch:** m2-project-ai-canonical-wiring  
**Service:** services/project-ai  
**Security Priority:** P0 - Authentication Vulnerability

## Context

The security audit found that `services/project-ai/app/api/routes/contract.py` uses a placeholder `verify_auth()` function that only checks token length (≥8 characters). This is not secure. The service must integrate with the existing TypeScript `@quiz/auth` token contract to verify JWTs using the same secrets, algorithms, and claim structure.

## Token Contract (TypeScript Reference)

From `packages/auth/src/token.service.ts`:

- **JWT Library:** TypeScript uses `jose`, Python will use `PyJWT`
- **Algorithm:** HS256 (HMAC-SHA256)
- **User Secret:** `JWT_SECRET` (NOT `JWT_SECRET_KEY`)
- **Admin Secret:** `ADMIN_JWT_SECRET` (falls back to `JWT_SECRET` if not set)
- **Refresh Secret:** `JWT_REFRESH_SECRET` (not used in project-ai currently)
- **User Audience:** `"user"`
- **Admin Audience:** `"admin"`
- **Token Type Claim:** `tokenType` with values `"user"` or `"admin"`
- **Identity Claims (Required):**
  - `userId` (string)
  - `originalUserId` (string) 
  - `shadowUserId` (string)
- **Additional Claims:**
  - `roles` (array of strings)
  - `isAdmin` (boolean)
  - `brand` (string, optional: "realtutorialhub" or "skillup")
  - `platform` (array, optional)
  - `subscriptions` (array, optional)

## Architectural Decisions

### Decision 1: Unified JWT Configuration Module

**Rationale:** The existing `app/auth/config.py` uses `JWT_SECRET_KEY`, but the TypeScript token contract uses `JWT_SECRET` and `ADMIN_JWT_SECRET`. Create a new `jwt_config.py` module specifically for token verification that reads the TypeScript-aligned environment variables.

**Approach:** Create `app/auth/jwt_config.py` that reads `JWT_SECRET` and `ADMIN_JWT_SECRET` (with fallback logic matching TypeScript). Keep existing `config.py` for backward compatibility with RBAC modules.

### Decision 2: PyJWT Library with Explicit Algorithm Enforcement

**Rationale:** PyJWT is the standard Python JWT library, well-maintained, and supports all required features (HS256, audience validation, expiration checks, required claims).

**Approach:** Use PyJWT 2.8.0+ with `algorithms=["HS256"]` explicitly specified in all `decode()` calls to prevent algorithm confusion attacks. Install with `pyjwt[crypto]>=2.8.0` for full cryptographic support.

### Decision 3: Separate User and Admin Verification Functions

**Rationale:** TypeScript has separate `verifyUserAccessToken()` and `verifyAdminAccessToken()` that use different secrets and validate different token types. Match this pattern in Python for consistency.

**Approach:** Create `verify_user_access_token()` and `verify_admin_access_token()` in `jwt_verifier.py`, each using the appropriate secret and validating the `tokenType` claim.

### Decision 4: FastAPI Depends() Wrappers for Injection

**Rationale:** FastAPI's dependency injection system provides clean separation between token verification (authentication) and role checking (authorization). Existing auth module already uses this pattern with `get_current_user()`.

**Approach:** Create three dependency functions:
- `get_current_user()` - Extracts and verifies user tokens, returns user payload
- `get_current_admin()` - Extracts and verifies admin tokens, returns admin payload  
- `require_authenticated()` - Generic dependency that accepts either user or admin tokens

### Decision 5: Startup Validation for JWT Configuration

**Rationale:** Fail fast if JWT secrets are missing or misconfigured. Better to catch configuration errors at startup than during first request.

**Approach:** Add JWT configuration validation to `main.py` lifespan that checks environment variables are set and meet minimum security requirements.

### Decision 6: Replace Placeholder verify_auth() In-Place

**Rationale:** Minimize code changes and maintain existing route structure. The `verify_auth()` function in `contract.py` already returns `user_id` string, so replacement should match this interface initially, then migrate to dependency injection.

**Approach:** Two-phase replacement:
1. Replace `verify_auth()` body to call new JWT verifier (maintains existing call sites)
2. Refactor route functions to use Depends(get_current_user) (cleaner pattern)

### Decision 7: Test Fixtures Using PyJWT for Token Generation

**Rationale:** Tests need to generate valid JWTs matching TypeScript token structure. Use PyJWT to create test tokens with controlled expiration and claims.

**Approach:** Create `tests/unit/fixtures/jwt_fixtures.py` with helper functions:
- `create_valid_user_token()` - Valid user token with all required claims
- `create_valid_admin_token()` - Valid admin token
- `create_expired_token()` - Expired token for expiration tests
- `create_invalid_signature_token()` - Token signed with wrong secret

---

## Implementation Steps

- [ ] 1. **Add PyJWT dependency to pyproject.toml**
      
      Add `pyjwt[crypto]>=2.8.0` to the `dependencies` array in `services/project-ai/pyproject.toml`.
      Remove `python-jose[cryptography]` if present (we're standardizing on PyJWT for token verification).
      
      **Files:**
      - `services/project-ai/pyproject.toml`
      
      **Verify:** 
      Run `pip install -e services/project-ai` and confirm PyJWT installs successfully. Run `python -c "import jwt; print(jwt.__version__)"` to verify version ≥2.8.0.

- [ ] 2. **Create jwt_config.py for TypeScript-aligned JWT configuration**
      
      Create `services/project-ai/app/auth/jwt_config.py` with a `get_token_secrets()` function that:
      - Reads `JWT_SECRET` from environment (raises ValueError if missing)
      - Reads `ADMIN_JWT_SECRET` from environment (falls back to `JWT_SECRET` if not set)
      - Returns dict with `user_secret`, `admin_secret`, and `algorithm` (HS256)
      - Validates secrets are at least 32 characters (security requirement)
      
      **Files:**
      - `services/project-ai/app/auth/jwt_config.py` (create new)
      
      **Verify:**
      Run `pytest tests/unit/test_jwt_config.py -v` (test file created in step 8) to verify configuration loading and validation logic.

- [ ] 3. **Create jwt_verifier.py with token verification functions**
      
      Create `services/project-ai/app/auth/jwt_verifier.py` with:
      
      **Function: `verify_user_access_token(token: str) -> dict`**
      - Uses `JWT_SECRET` to decode token
      - Validates algorithm is HS256 using `algorithms=["HS256"]` parameter
      - Validates audience is "user" using `audience="user"` parameter
      - Validates expiration (automatic with PyJWT decode)
      - Checks required claims: `userId`, `originalUserId`, `shadowUserId` (raise ValueError if missing)
      - Checks `tokenType` claim equals "user" (raise ValueError if not)
      - Returns payload dict with all claims
      - Raises `jwt.ExpiredSignatureError` for expired tokens
      - Raises `jwt.InvalidTokenError` for invalid signature/format
      - Raises `jwt.InvalidAudienceError` for wrong audience
      - Raises `ValueError` for missing required claims
      
      **Function: `verify_admin_access_token(token: str) -> dict`**
      - Uses `ADMIN_JWT_SECRET` to decode token
      - Validates algorithm is HS256
      - Validates audience is "admin" using `audience="admin"` parameter
      - Validates expiration (automatic)
      - Checks required claims: `userId`, `originalUserId`, `shadowUserId`
      - Checks `tokenType` claim equals "admin"
      - Checks `isAdmin` claim is True (raise ValueError if not)
      - Returns payload dict with all claims
      - Same error handling as user token verification
      
      Use PyJWT API: `jwt.decode(token, secret, algorithms=["HS256"], audience=expected_audience)`
      
      **Files:**
      - `services/project-ai/app/auth/jwt_verifier.py` (create new)
      
      **Verify:**
      Run `pytest tests/unit/test_jwt_verifier.py -v` (test file created in step 8) to verify both verification functions handle valid tokens, expired tokens, wrong audience, wrong signature, and missing claims.

- [ ] 4. **Create FastAPI dependency functions in dependencies.py**
      
      Add three new dependency functions to `services/project-ai/app/auth/dependencies.py`:
      
      **Function: `get_current_user_verified(authorization: str = Header(None)) -> dict`**
      - Extracts Bearer token from Authorization header
      - Validates header format: "Bearer <token>"
      - Calls `verify_user_access_token(token)`
      - Returns payload dict with userId, originalUserId, shadowUserId, roles, etc.
      - Raises HTTPException(401) for missing/invalid/expired tokens
      - Error messages: "Missing authorization header", "Invalid authorization header format", "Invalid or expired token"
      
      **Function: `get_current_admin_verified(authorization: str = Header(None)) -> dict`**
      - Same as `get_current_user_verified` but calls `verify_admin_access_token(token)`
      - Returns admin payload dict
      - Same error handling
      
      **Function: `require_authenticated(authorization: str = Header(None)) -> dict`**
      - Accepts either user or admin tokens
      - Try `verify_user_access_token()` first, if fails try `verify_admin_access_token()`
      - Returns payload dict from whichever succeeds
      - Raises HTTPException(401) if both fail
      
      Keep existing `get_current_user()` function (used by RBAC features) - it uses the old JWT_SECRET_KEY configuration.
      
      **Files:**
      - `services/project-ai/app/auth/dependencies.py`
      
      **Verify:**
      Run `pytest tests/unit/test_jwt_dependencies.py -v` (new test file created in step 9) to verify dependency functions extract tokens, handle missing headers, expired tokens, and invalid tokens correctly.

- [ ] 5. **Update auth module __init__.py exports**
      
      Update `services/project-ai/app/auth/__init__.py` to export new functions:
      - Add `from .jwt_verifier import verify_user_access_token, verify_admin_access_token`
      - Add `from .jwt_config import get_token_secrets`
      - Update `__all__` list to include new exports
      
      Keep existing exports for backward compatibility.
      
      **Files:**
      - `services/project-ai/app/auth/__init__.py`
      
      **Verify:**
      Run `python -c "from app.auth import verify_user_access_token, verify_admin_access_token, get_token_secrets; print('Imports successful')"` from services/project-ai directory.

- [ ] 6. **Replace verify_auth() placeholder in contract.py**
      
      Replace the `verify_auth()` function body in `services/project-ai/app/api/routes/contract.py`:
      
      **Old implementation (lines ~70-100):**
      ```python
      async def verify_auth(authorization: Optional[str] = Header(None)) -> str:
          # Placeholder: checks token length only
          if not token or len(token) < 8:
              raise HTTPException(status_code=401, detail="Invalid token")
          user_id = f"user-{token[:8]}"
          return user_id
      ```
      
      **New implementation:**
      ```python
      async def verify_auth(authorization: Optional[str] = Header(None)) -> str:
          """
          Verify authentication token and extract user ID.
          
          This function maintains backward compatibility with existing route signatures.
          For new routes, use Depends(get_current_user_verified) or Depends(require_authenticated).
          """
          from app.auth import verify_user_access_token, verify_admin_access_token
          
          if not authorization:
              raise HTTPException(status_code=401, detail="Missing authorization header. Authentication required.")
          
          if not authorization.startswith("Bearer "):
              raise HTTPException(status_code=401, detail="Invalid authorization header format. Expected 'Bearer <token>'")
          
          token = authorization[7:]  # Remove "Bearer " prefix
          
          # Try user token first, then admin token
          try:
              payload = verify_user_access_token(token)
              return payload["userId"]
          except Exception:
              pass
          
          try:
              payload = verify_admin_access_token(token)
              return payload["userId"]
          except jwt.ExpiredSignatureError:
              raise HTTPException(status_code=401, detail="Token expired")
          except jwt.InvalidAudienceError:
              raise HTTPException(status_code=401, detail="Invalid token audience")
          except jwt.InvalidTokenError:
              raise HTTPException(status_code=401, detail="Invalid token signature")
          except ValueError as e:
              raise HTTPException(status_code=401, detail=f"Invalid token claims: {str(e)}")
      ```
      
      Import jwt at the top of the file: `import jwt`
      
      **Files:**
      - `services/project-ai/app/api/routes/contract.py`
      
      **Verify:**
      Run `pytest tests/unit/test_contract_routes.py -v` (existing test file) to verify contract routes still work. Run `pytest tests/integration/test_w2_contract_generation.py -v` to verify contract generation with authentication.

- [ ] 7. **Add authentication to workflows.py routes**
      
      Add authentication to all routes in `services/project-ai/app/api/routes/workflows.py` using FastAPI Depends():
      
      **Routes to protect:**
      - `POST /workflows` - Add `user: dict = Depends(require_authenticated)` parameter
      - `GET /workflows/{workflow_id}` - Add `user: dict = Depends(require_authenticated)` parameter
      - `POST /workflows/{workflow_id}/transition` - Add `user: dict = Depends(require_authenticated)` parameter
      - `GET /workflows/{workflow_id}/history` - Add `user: dict = Depends(require_authenticated)` parameter
      - `POST /workflows/{workflow_id}/artifacts` - Add `user: dict = Depends(require_authenticated)` parameter
      - `GET /workflows` - Add `user: dict = Depends(require_authenticated)` parameter
      
      Add import at top: `from app.auth.dependencies import require_authenticated`
      
      For routes that create workflows (POST /workflows), use `user["userId"]` as the `requester_id`.
      For routes that modify workflows, optionally add ownership validation (verify `user["userId"]` matches `workflow.requester_id`).
      
      **Files:**
      - `services/project-ai/app/api/routes/workflows.py`
      
      **Verify:**
      Run `pytest tests/integration/test_workflows_auth.py -v` (new test file created in step 10) to verify workflows routes reject unauthenticated requests and accept valid tokens.

- [ ] 8. **Create test_jwt_config.py and test_jwt_verifier.py unit tests**
      
      Create `services/project-ai/tests/unit/test_jwt_config.py`:
      - Test `get_token_secrets()` with valid environment variables
      - Test missing `JWT_SECRET` raises ValueError
      - Test `ADMIN_JWT_SECRET` falls back to `JWT_SECRET`
      - Test secrets shorter than 32 characters raise ValueError
      
      Create `services/project-ai/tests/unit/test_jwt_verifier.py`:
      - Test `verify_user_access_token()` with valid user token (all required claims present, tokenType="user", audience="user")
      - Test `verify_user_access_token()` with expired token raises jwt.ExpiredSignatureError
      - Test `verify_user_access_token()` with wrong audience raises jwt.InvalidAudienceError
      - Test `verify_user_access_token()` with wrong secret raises jwt.InvalidTokenError
      - Test `verify_user_access_token()` with missing userId claim raises ValueError
      - Test `verify_user_access_token()` with tokenType="admin" raises ValueError
      - Test `verify_admin_access_token()` with valid admin token (all claims, tokenType="admin", audience="admin", isAdmin=true)
      - Test `verify_admin_access_token()` with expired token raises jwt.ExpiredSignatureError
      - Test `verify_admin_access_token()` with tokenType="user" raises ValueError
      - Test `verify_admin_access_token()` with isAdmin=false raises ValueError
      
      Use PyJWT to create test tokens:
      ```python
      import jwt
      from datetime import datetime, timedelta, timezone
      
      def create_test_user_token(secret: str, expired: bool = False) -> str:
          payload = {
              "userId": "test-user-123",
              "originalUserId": "test-user-123",
              "shadowUserId": "test-user-123",
              "email": "test@example.com",
              "roles": ["contract_viewer"],
              "tokenType": "user",
              "aud": "user",
              "exp": datetime.now(timezone.utc) + timedelta(hours=8 if not expired else -1)
          }
          return jwt.encode(payload, secret, algorithm="HS256")
      ```
      
      Set up fixtures to configure environment variables before tests run (use autouse fixture like existing auth tests).
      
      **Files:**
      - `services/project-ai/tests/unit/test_jwt_config.py` (create new)
      - `services/project-ai/tests/unit/test_jwt_verifier.py` (create new)
      
      **Verify:**
      Run `pytest tests/unit/test_jwt_config.py tests/unit/test_jwt_verifier.py -v` and confirm all tests pass (minimum 15 tests total).

- [ ] 9. **Create test_jwt_dependencies.py unit tests**
      
      Create `services/project-ai/tests/unit/test_jwt_dependencies.py`:
      - Test `get_current_user_verified()` with valid user token extracts payload
      - Test `get_current_user_verified()` with missing authorization header raises HTTPException 401
      - Test `get_current_user_verified()` with invalid header format raises HTTPException 401
      - Test `get_current_user_verified()` with expired token raises HTTPException 401
      - Test `get_current_user_verified()` with admin token raises HTTPException 401 (wrong token type)
      - Test `get_current_admin_verified()` with valid admin token extracts payload
      - Test `get_current_admin_verified()` with user token raises HTTPException 401
      - Test `require_authenticated()` accepts user token and returns payload
      - Test `require_authenticated()` accepts admin token and returns payload
      - Test `require_authenticated()` with invalid token raises HTTPException 401
      
      Use helper functions from test_jwt_verifier.py to create test tokens.
      
      **Files:**
      - `services/project-ai/tests/unit/test_jwt_dependencies.py` (create new)
      
      **Verify:**
      Run `pytest tests/unit/test_jwt_dependencies.py -v` and confirm all tests pass (minimum 10 tests).

- [ ] 10. **Create test_workflows_auth.py integration tests**
      
      Create `services/project-ai/tests/integration/test_workflows_auth.py`:
      - Test POST /workflows without authorization header returns 401
      - Test POST /workflows with invalid token returns 401
      - Test POST /workflows with expired token returns 401
      - Test POST /workflows with valid user token succeeds (201)
      - Test POST /workflows with valid admin token succeeds (201)
      - Test GET /workflows/{workflow_id} without authorization returns 401
      - Test GET /workflows/{workflow_id} with valid token returns 200
      - Test GET /workflows without authorization returns 401
      - Test GET /workflows with valid token returns 200
      
      Use TestClient from fastapi.testclient to call routes with Authorization headers.
      Use PyJWT to generate test tokens matching TypeScript token structure.
      
      **Files:**
      - `services/project-ai/tests/integration/test_workflows_auth.py` (create new)
      
      **Verify:**
      Run `pytest tests/integration/test_workflows_auth.py -v` and confirm all tests pass (minimum 9 tests).

- [ ] 11. **Add JWT configuration validation to main.py startup**
      
      Update `services/project-ai/app/main.py` lifespan function to validate JWT configuration:
      
      Add after database validation (around line 40):
      ```python
      # Startup: Validate JWT configuration
      try:
          from app.auth.jwt_config import get_token_secrets
          secrets = get_token_secrets()
          print(f"✓ JWT configuration validated (algorithm: {secrets['algorithm']}, user_secret: {len(secrets['user_secret'])} chars, admin_secret: {len(secrets['admin_secret'])} chars)")
      except Exception as e:
          print(f"ERROR: JWT configuration validation failed: {e}")
          raise
      ```
      
      This replaces the existing JWT validation that calls `get_jwt_config()` (which uses wrong environment variable names).
      
      **Files:**
      - `services/project-ai/app/main.py`
      
      **Verify:**
      Start the service with `python -m app.main` after setting `JWT_SECRET` and `ADMIN_JWT_SECRET` environment variables. Confirm startup logs show "✓ JWT configuration validated". Start without environment variables and confirm service fails to start with clear error message.

- [ ] 12. **Run full test suite and verify all tests pass**
      
      Run the complete test suite to verify:
      - No regressions in existing tests
      - New JWT verification tests pass
      - New integration tests pass
      - Test coverage includes all new modules
      
      Commands:
      ```bash
      cd services/project-ai
      pytest tests/unit/ -v
      pytest tests/integration/ -v  # May skip if TEST_DATABASE_URL_TUTORIAL not configured
      pytest tests/ --cov=app/auth --cov-report=term-missing
      ```
      
      Expected results:
      - All unit tests pass (300+ tests)
      - New auth tests pass (25+ new tests)
      - Coverage for app/auth/*.py ≥ 90%
      
      **Files:** N/A
      
      **Verify:**
      All pytest commands complete successfully with no failures. Coverage report shows high coverage for jwt_config.py, jwt_verifier.py, and dependencies.py.

---

## Verification Strategy

### Unit Tests Coverage

**New test files:** 3 files, ~25 tests total
- `tests/unit/test_jwt_config.py` - Configuration loading and validation
- `tests/unit/test_jwt_verifier.py` - Token verification logic (valid, expired, wrong audience, wrong signature, missing claims)
- `tests/unit/test_jwt_dependencies.py` - FastAPI dependency functions

**Test scenarios:**
1. ✅ Valid user token with all required claims → Verification succeeds
2. ✅ Valid admin token with isAdmin=true → Verification succeeds
3. ❌ Expired token → jwt.ExpiredSignatureError raised
4. ❌ Token signed with wrong secret → jwt.InvalidTokenError raised
5. ❌ Token with wrong audience → jwt.InvalidAudienceError raised
6. ❌ Token missing userId claim → ValueError raised
7. ❌ Token missing shadowUserId claim → ValueError raised
8. ❌ User token with tokenType="admin" → ValueError raised
9. ❌ Admin token with isAdmin=false → ValueError raised
10. ❌ Missing Authorization header → HTTPException 401
11. ❌ Invalid header format (no "Bearer") → HTTPException 401

### Integration Tests Coverage

**New test file:** 1 file, ~9 tests
- `tests/integration/test_workflows_auth.py` - End-to-end authentication on workflow routes

**Test scenarios:**
1. POST /workflows without auth → 401
2. POST /workflows with valid user token → 201
3. POST /workflows with valid admin token → 201
4. GET /workflows/{id} without auth → 401
5. GET /workflows/{id} with valid token → 200

### Manual Verification

1. **Start service with missing JWT_SECRET:**
   - Expected: Service fails to start with error "JWT_SECRET environment variable is required"

2. **Start service with valid configuration:**
   - Expected: Startup logs show "✓ JWT configuration validated"

3. **Call contract endpoint without Authorization header:**
   ```bash
   curl -X POST http://localhost:8000/workflows/wf-123/engineering-contract
   ```
   - Expected: 401 Unauthorized, "Missing authorization header"

4. **Call contract endpoint with invalid token:**
   ```bash
   curl -X POST http://localhost:8000/workflows/wf-123/engineering-contract \
     -H "Authorization: Bearer invalid.token.here"
   ```
   - Expected: 401 Unauthorized, "Invalid token signature"

5. **Call contract endpoint with valid token:**
   ```bash
   # Generate valid token using TypeScript TokenService
   TOKEN=$(node -e "const {TokenService} = require('./packages/auth'); TokenService.generateAccessToken({userId:'u123',originalUserId:'u123',shadowUserId:'u123',email:'test@example.com',roles:[],tokenType:'user'}).then(t=>console.log(t))")
   curl -X POST http://localhost:8000/workflows/wf-123/engineering-contract \
     -H "Authorization: Bearer $TOKEN"
   ```
   - Expected: 200 OK or business logic error (not 401)

---

## Files to Create/Modify

### New Files (7)
1. `services/project-ai/app/auth/jwt_config.py` - JWT configuration for TypeScript token contract
2. `services/project-ai/app/auth/jwt_verifier.py` - Token verification functions
3. `services/project-ai/tests/unit/test_jwt_config.py` - Config tests
4. `services/project-ai/tests/unit/test_jwt_verifier.py` - Verifier tests
5. `services/project-ai/tests/unit/test_jwt_dependencies.py` - Dependency tests
6. `services/project-ai/tests/integration/test_workflows_auth.py` - Integration tests

### Modified Files (5)
1. `services/project-ai/pyproject.toml` - Add pyjwt[crypto]>=2.8.0
2. `services/project-ai/app/auth/__init__.py` - Export new functions
3. `services/project-ai/app/auth/dependencies.py` - Add new dependency functions
4. `services/project-ai/app/api/routes/contract.py` - Replace verify_auth() placeholder
5. `services/project-ai/app/api/routes/workflows.py` - Add authentication to all routes
6. `services/project-ai/app/main.py` - Add JWT config validation to startup

---

## Security Considerations

### 1. Algorithm Confusion Prevention
**Risk:** Attacker provides token with `alg: "none"` or `alg: "HS256"` when expecting RSA.  
**Mitigation:** Always specify `algorithms=["HS256"]` explicitly in PyJWT decode().

### 2. Secret Strength Validation
**Risk:** Weak secrets can be brute-forced.  
**Mitigation:** Validate secrets are ≥32 characters at startup.

### 3. Audience Validation
**Risk:** User token used where admin token expected.  
**Mitigation:** Always validate `audience` parameter in decode(). Check `tokenType` claim matches expected type.

### 4. Identity Claim Validation
**Risk:** Token missing userId/shadowUserId allows unauthorized access.  
**Mitigation:** Explicitly check required claims exist and are non-empty strings after decode.

### 5. Token Expiration
**Risk:** Expired tokens accepted.  
**Mitigation:** PyJWT automatically validates expiration in decode(). Ensure `exp` claim is always set.

### 6. Error Message Information Disclosure
**Risk:** Detailed error messages reveal token structure or secrets.  
**Mitigation:** Return generic "Invalid or expired token" messages to clients. Log detailed errors server-side only.

---

## Environment Variables Required

### Development/Testing
```bash
export JWT_SECRET="test-user-secret-at-least-32-characters-long-for-development"
export ADMIN_JWT_SECRET="test-admin-secret-at-least-32-characters-long-for-development"
```

### Production
```bash
export JWT_SECRET="<production-user-secret-from-secure-vault>"
export ADMIN_JWT_SECRET="<production-admin-secret-from-secure-vault>"
```

**Note:** These must match the secrets configured in the TypeScript services (`api-server`, BFF) to ensure tokens issued by TypeScript services can be verified by Python services.

---

## Rollback Plan

If issues are discovered after deployment:

1. **Immediate:** Set `JWT_SECRET` to a known working value in production environment
2. **Short-term:** Revert commits on `m2-project-ai-canonical-wiring` branch
3. **Long-term:** Re-enable placeholder auth (modify `verify_auth()` to return hardcoded user_id) while fixing issues

**Files to revert:**
- `services/project-ai/app/api/routes/contract.py` (restore placeholder verify_auth)
- `services/project-ai/app/api/routes/workflows.py` (remove Depends(require_authenticated))

---

## Success Criteria

✅ **Security:** All endpoints verify JWT signature, audience, expiration, and required claims  
✅ **Compatibility:** Tokens issued by TypeScript TokenService can be verified by Python service  
✅ **Testing:** ≥25 new tests covering valid/invalid/expired/wrong-audience scenarios  
✅ **Coverage:** ≥90% code coverage for new auth modules  
✅ **Documentation:** Clear error messages for authentication failures  
✅ **Startup Validation:** Service fails fast if JWT_SECRET not configured  

---

## Timeline Estimate

- Step 1-2: 30 minutes (dependency + config)
- Step 3: 2 hours (jwt_verifier.py implementation)
- Step 4: 1 hour (FastAPI dependencies)
- Step 5: 15 minutes (exports)
- Step 6: 1 hour (contract.py replacement)
- Step 7: 1 hour (workflows.py authentication)
- Step 8-9: 3 hours (unit tests)
- Step 10: 1.5 hours (integration tests)
- Step 11: 30 minutes (startup validation)
- Step 12: 1 hour (full test suite + verification)

**Total:** ~12 hours of implementation + testing time
