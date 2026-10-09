# JWT Authentication Infrastructure

Adds JWT token generation and validation using python-jose with RBAC enforcement for contract API roles. The implementation provides three role levels (admin > reviewer > viewer) with FastAPI dependency injection and environment-based configuration that fails fast if the secret key is missing or weak.

**Watch for:** Role enforcement doesn't use FastAPI's Depends() properly (confirmed), test count mismatch between spec and implementation (confirmed), timezone-aware datetime not tested (likely).

**Verdict**: CHANGES_REQUESTED

## High-level view

The auth module consists of three files: config.py validates environment variables at startup and enforces a 32-character minimum for JWT_SECRET_KEY, jwt.py handles token encoding/decoding with python-jose using HS256, and dependencies.py extracts users from Bearer tokens and enforces role requirements. The role hierarchy (admin > reviewer > viewer) is implemented through inclusive checks where higher roles satisfy lower role requirements. JWT validation is wired into main.py lifespan to fail startup if configuration is invalid. Test coverage includes 15 unit tests across token lifecycle, role enforcement, and error handling, with good coverage of expired tokens, invalid signatures, malformed tokens, and role hierarchy cases.

<details>
<summary>Issues (3)</summary>

1. **RBAC dependencies don't use Depends() chain** — The require_contract_* functions accept user as an optional parameter with default None instead of using `user: dict = Depends(get_current_user)`. This means they won't automatically extract the user from the Authorization header when used as FastAPI dependencies. Fix by changing signature to `def require_contract_admin(user: dict = Depends(get_current_user)) -> dict:` and removing the None check.

2. **Test count mismatch** — FEAT-001 spec requires 12 tests but implementation delivers 15 tests (6 in test_auth_jwt.py, 9 in test_auth_dependencies.py). This exceeds the requirement, which is fine, but the implementation summary and acceptance criteria state "12 unit tests pass" when 15 actually pass. Update documentation to reflect actual count.

3. **timezone.utc usage not tested in Python 3.11** — jwt.py uses `datetime.now(timezone.utc)` which is the modern recommended approach, but test_auth_jwt.py doesn't verify timezone-aware datetime handling. The exp claim should use timezone-aware datetimes to avoid ambiguity across systems. Add a test that verifies the exp claim contains a timezone-aware datetime.

</details>

<details>
<summary>Details</summary>

## JWT configuration with startup validation

The config.py module reads three environment variables: JWT_SECRET_KEY (required, minimum 32 characters), JWT_ALGORITHM (defaults to HS256), and JWT_ACCESS_TOKEN_EXPIRE_MINUTES (defaults to 30). The validation logic raises ValueError with clear messages if the secret key is missing or too short, which surfaces immediately during the lifespan startup sequence in main.py, preventing runtime auth failures.

## Token operations with python-jose

The jwt.py module provides create_access_token() and decode_access_token(). Token creation copies the input data dict, adds an exp claim using timezone-aware UTC datetime, and encodes with jose.jwt.encode(). Token decoding catches ExpiredSignatureError and JWTError and converts both to HTTPException 401 with "Invalid or expired token" detail. The use of `datetime.now(timezone.utc)` follows modern Python best practices for timezone-aware datetimes.

The implementation doesn't verify the sub claim is present. A token without a sub claim would decode successfully but result in user_id=None in the user dict, potentially causing issues in code that assumes user_id is always present.

## RBAC with role hierarchy

The dependencies.py module implements get_current_user() which extracts the Bearer token from the Authorization header, decodes it, and returns {user_id: payload['sub'], roles: payload.get('roles', [])}. The three role enforcement functions implement hierarchy through inclusive checks:

- contract_admin: must have "contract_admin" role
- contract_reviewer: must have "contract_reviewer" OR "contract_admin" role  
- contract_viewer: must have any of "contract_viewer", "contract_reviewer", or "contract_admin"

The role enforcement functions have `user: dict = None` signatures instead of `user: dict = Depends(get_current_user)`. When used as `dependencies=[Depends(require_contract_admin)]` in a route, FastAPI won't know to call get_current_user() first. The correct pattern is `def require_contract_admin(user: dict = Depends(get_current_user)) -> dict:` which chains the dependencies automatically. The test file calls the functions directly with user dicts rather than testing them as FastAPI dependencies, so this gap isn't caught.

## Test coverage

The test suite includes 15 tests across two files (6 in test_auth_jwt.py, 9 in test_auth_dependencies.py):

Token lifecycle tests: token creation with valid data, token decoding and validation, expired token rejection (uses timedelta(seconds=-1)), invalid signature rejection (creates token with wrong secret), malformed token rejection, full create→decode roundtrip with multiple claims.

RBAC tests: valid Bearer token extraction, missing authorization header error, invalid token error, admin role check success and failure, viewer accepts all three roles and rejects non-contract roles, reviewer accepts reviewer and admin roles but rejects viewer, invalid header format (missing Bearer prefix, single token), None user handling for all three role functions.

The expired token test uses `timedelta(seconds=-1)` which creates a token that expires immediately, forcing ExpiredSignatureError on decode. The invalid signature test creates a token with a different 32-character secret to bypass the config validation but fail signature verification.

Not tested: timezone-aware datetime handling in exp claim, token creation without explicit expires_delta (uses default from config), role enforcement as FastAPI dependencies rather than direct function calls (would catch the Depends() issue).

## Integration with main.py

The lifespan function calls get_jwt_config() during startup after database validation. If configuration is invalid, the ValueError propagates and prevents the application from starting. The success message prints the algorithm and token expiry setting.

</details>

<details>
<summary>File Map</summary>

### New Files (8)

- `services/project-ai/pyproject.toml` — Added python-jose[cryptography]>=3.3.0 dependency
- `services/project-ai/app/auth/__init__.py` — Module exports for JWT and RBAC functions
- `services/project-ai/app/auth/config.py` — Environment variable configuration with validation
- `services/project-ai/app/auth/jwt.py` — Token creation and decoding with python-jose
- `services/project-ai/app/auth/dependencies.py` — RBAC enforcement functions
- `services/project-ai/app/main.py` — Added JWT config validation to lifespan
- `services/project-ai/tests/unit/test_auth_jwt.py` — 6 tests for token operations
- `services/project-ai/tests/unit/test_auth_dependencies.py` — 9 tests for RBAC

[Full diff available via `git diff main services/project-ai/app/auth/ services/project-ai/app/main.py services/project-ai/tests/unit/test_auth*.py`]

</details>
