# Implementation Plan: Wave 1A - JWT Alignment

## Objective
Align Python JWT verification in Project AI service with SHC token issuance secrets and contracts to fix the parallel authentication system.

## Current State (BROKEN)
- Python uses `JWT_SECRET_KEY` (independent variable)
- SHC uses `JWT_SECRET` (user tokens) and `ADMIN_JWT_SECRET` (admin tokens)
- Python rejects admin tokens (tokenType='admin')
- No issuer validation for "skillhubcore.in"
- Result: Python accepts tokens SHC never issued

## Target State
- Python reads `JWT_SECRET` and `ADMIN_JWT_SECRET` from environment (same as SHC)
- Python validates issuer: `iss='skillhubcore.in'`
- Python accepts user tokens (signed with `JWT_SECRET`, tokenType='user', aud='user')
- Python accepts admin tokens (signed with `ADMIN_JWT_SECRET`, tokenType='admin', aud='admin')
- Dual-secret verification: try user secret first, fall back to admin secret

## Implementation Steps

- [ ] 1. **Update config.py to use SHC environment variables**
      Replace `JWT_SECRET_KEY` with `JWT_SECRET` and `ADMIN_JWT_SECRET`.
      Files: `services/project-ai/app/auth/config.py`
      Changes:
      - Replace `JWT_SECRET_KEY` environment variable with `JWT_SECRET`
      - Add `ADMIN_JWT_SECRET` environment variable (fallback to `JWT_SECRET` if not set, matching SHC pattern from `packages/auth/src/token.service.ts` lines 90-94)
      - Update `get_jwt_config()` return value: dict with `user_secret` and `admin_secret` keys
      - Keep validation: both secrets must be >= 32 characters
      - Update error messages to reference `JWT_SECRET` instead of `JWT_SECRET_KEY`
      Verify: Run `pytest tests/` from `services/project-ai` - all existing tests pass with new config structure

- [ ] 2. **Add issuer and dual-secret validation to jwt.py**
      Update `decode_access_token()` to validate issuer and accept admin tokens.
      Files: `services/project-ai/app/auth/jwt.py`
      Changes:
      - Add issuer validation: `payload.get('iss')` must equal `'skillhubcore.in'` (raises 401 if missing/wrong)
      - Update audience validation: accept both `'user'` and `'admin'` values
      - Update tokenType validation: accept both `'user'` and `'admin'` values
      - Implement dual-secret verification pattern (from SHC `token.service.ts` lines 415-442):
        * Try `jwt.decode(token, config['user_secret'], algorithms=['HS256'])`
        * On JWTError, try `jwt.decode(token, config['admin_secret'], algorithms=['HS256'])`
        * Raise 401 if both fail
      - Keep identity claims validation: `userId`, `originalUserId`, `shadowUserId` (all non-empty strings)
      - Update `create_access_token()` to use `config['user_secret']`
      Verify: Run `pytest tests/test_jwt_alignment.py -v` (created in step 3) - user and admin token tests pass

- [ ] 3. **Add JWT alignment test suite**
      Create comprehensive tests covering all Wave 1A requirements.
      Files: `services/project-ai/tests/test_jwt_alignment.py`
      Changes:
      - Add helper function to create test tokens using `jose.jwt.encode()` with HS256
      - Test 1: User token (signed with JWT_SECRET, tokenType='user', aud='user', iss='skillhubcore.in') - PASS
      - Test 2: Admin token (signed with ADMIN_JWT_SECRET, tokenType='admin', aud='admin', iss='skillhubcore.in') - PASS
      - Test 3: Missing issuer - FAIL (401)
      - Test 4: Wrong issuer (iss='attacker.com') - FAIL (401)
      - Test 5: User token signed with external secret - FAIL (401)
      - Test 6: Admin token signed with JWT_SECRET instead of ADMIN_JWT_SECRET - FAIL (401)
      - Test 7: Missing identity claims (no userId) - FAIL (401)
      - Test 8: Expired token - FAIL (401)
      - Add docstrings explaining Wave 1A alignment objective
      Verify: Run `pytest tests/test_jwt_alignment.py -v` - all 8 tests pass

- [ ] 4. **Create .env.example**
      Document required environment variables for SHC alignment.
      Files: `services/project-ai/.env.example`
      Content:
      ```bash
      # JWT Configuration (SHC Alignment - Wave 1A)
      # Must match secrets used by packages/auth TokenService
      JWT_SECRET=your-secure-jwt-secret-at-least-32-characters-long
      ADMIN_JWT_SECRET=your-secure-admin-jwt-secret-at-least-32-characters
      JWT_ALGORITHM=HS256
      JWT_ACCESS_TOKEN_EXPIRE_MINUTES=30
      
      # Database Configuration
      DATABASE_URL_TUTORIAL=postgresql://user:pass@host/tutorial_prod?sslmode=require
      TEST_DATABASE_URL_TUTORIAL=postgresql+asyncpg://user:pass@host/tutorial_test?sslmode=require
      ```
      Verify: File exists and documents all JWT environment variables

- [ ] 5. **Update README.md with JWT authentication documentation**
      Document SHC alignment in the README.
      Files: `services/project-ai/README.md`
      Changes:
      - Add section "JWT Authentication (SHC Alignment)" after "Configuration" section
      - Document `JWT_SECRET` and `ADMIN_JWT_SECRET` environment variables
      - Explain issuer validation (`iss='skillhubcore.in'`)
      - Explain user vs admin token support
      - Link to `packages/auth/src/token.service.ts` for SHC token issuance reference
      - Add example of valid token structure
      Verify: README.md has clear JWT authentication section with environment variables and validation rules

- [ ] 6. **Run full test suite and verify alignment**
      Confirm all changes work together.
      Files: All modified files
      Verification:
      - Run `cd services/project-ai && pytest tests/ -v` - all tests pass
      - Run `pytest tests/test_jwt_alignment.py -v` - all 8 JWT alignment tests pass
      - Run `pytest tests/ --cov=app/auth --cov-report=term` - JWT validation coverage >= 90%
      - Verify no environment variable conflicts: `JWT_SECRET` and `ADMIN_JWT_SECRET` replace `JWT_SECRET_KEY`

## SHC Token Contract Reference

From `packages/auth/src/token.service.ts`:

**User Tokens:**
- Secret: `JWT_SECRET` (line 82)
- Issuer: `iss: "skillhubcore.in"` (line 357)
- Audience: `aud: "user"`
- Token Type: `tokenType: "user"`
- Identity Claims: `userId`, `originalUserId`, `shadowUserId`

**Admin Tokens:**
- Secret: `ADMIN_JWT_SECRET` (fallback to `JWT_SECRET` if not set) (lines 90-94)
- Issuer: `iss: "skillhubcore.in"` (line 357)
- Audience: `aud: "admin"`
- Token Type: `tokenType: "admin"`
- Identity Claims: `userId`, `originalUserId`, `shadowUserId`

**Verification Pattern (lines 415-442):**
```typescript
// Try user secret first
try {
  const { payload } = await jwtVerify(token, this.ACCESS_SECRET);
  // validate payload
  return typedPayload;
} catch (err) {
  // Fall back to admin secret
  const { payload } = await jwtVerify(token, this.ADMIN_SECRET);
  // validate payload
  return typedPayload;
}
```

## Dependencies
- python-jose[cryptography] (already in pyproject.toml)
- pytest, pytest-asyncio (already in pyproject.toml dev dependencies)

## Test Commands
```bash
# Install dependencies
cd services/project-ai
pip install -e ".[dev]"

# Run JWT alignment tests
pytest tests/test_jwt_alignment.py -v

# Run all tests
pytest tests/ -v

# Run with coverage
pytest tests/ --cov=app/auth --cov-report=term
```

## Success Criteria
✅ Python reads `JWT_SECRET` and `ADMIN_JWT_SECRET` from environment
✅ Python validates issuer (`iss='skillhubcore.in'`)
✅ Python accepts user tokens signed with `JWT_SECRET`
✅ Python accepts admin tokens signed with `ADMIN_JWT_SECRET`
✅ Python rejects tokens with wrong issuer or wrong secret
✅ All identity claims validated (`userId`, `originalUserId`, `shadowUserId`)
✅ 8 JWT alignment tests pass
✅ Test coverage >= 90% for `app/auth` module
✅ .env.example documents SHC alignment
✅ README.md explains JWT authentication contract
