# Implementation Plan: Wave 1B - Identity Extraction

## Context

**Current State:**
- `get_current_user()` in `services/project-ai/app/auth/dependencies.py` (lines 11-57) only extracts 4 fields: `user_id`, `roles`, `token_type`, `is_admin`
- The function calls `decode_access_token(token)` from `app/auth/jwt.py` which returns the **raw JWT payload dict** (verified by reading jwt.py lines 59-159)
- `decode_access_token()` validates required claims (`userId`, `originalUserId`, `shadowUserId`) but does NOT remap field names—it hands back the JWT payload as-is
- 9 route files use `get_current_user()`: agents.py, tasks.py, governance.py, evidence.py, candidate.py, snapshot.py, contract.py, workflows.py, and others
- Existing test pattern: `tests/unit/test_auth_dependencies.py` and `tests/unit/test_auth_jwt.py`
- Project uses TypedDict (seen in `app/evidence/ledger.py` line 45)
- Test command: `pytest tests/unit/test_auth_*.py --cov=app/auth`

**Target:**
- Extract all 11 identity claims from SHC JWT tokens to support Wave 1C (brand isolation) and Wave 1D (RBAC)
- Create `AuthenticatedPrincipal` TypedDict type
- Update route handlers to use the new type annotation
- NO breaking changes to existing routes (they continue to receive dict with same keys, just more keys added)

## Implementation Steps

- [ ] 1. Create `services/project-ai/app/auth/types.py` with `AuthenticatedPrincipal` TypedDict containing all 11 identity fields (user_id, original_user_id, shadow_user_id, brand, roles, portal_identity, token_type, is_admin, email, platforms, subscriptions).
      Files: `services/project-ai/app/auth/types.py` (new file)
      Verify: Import the module in Python REPL: `python -c "from app.auth.types import AuthenticatedPrincipal; print(AuthenticatedPrincipal.__annotations__)"` — should print all 11 field names without import errors.

- [ ] 2. Update `get_current_user()` in `services/project-ai/app/auth/dependencies.py` to extract all 11 claims from the JWT payload and return `AuthenticatedPrincipal` typed dict. Keep existing field extraction logic (userId → user_id, with sub fallback) and add 8 new fields: original_user_id (from originalUserId), shadow_user_id (from shadowUserId), brand, email, portal_identity (from portalIdentity), platforms (default []), subscriptions (default []). Change return type annotation from `dict` to `AuthenticatedPrincipal`.
      Files: `services/project-ai/app/auth/dependencies.py` (lines 11-57)
      Verify: `pytest tests/unit/test_auth_dependencies.py -v` — existing 14 tests must pass (no breaking changes to dict keys that tests already check).

- [ ] 3. Update route handler type annotations in all 9 route files to use `AuthenticatedPrincipal` instead of `dict` for the `user` parameter. Files to change: `app/api/routes/agents.py` (2 handlers), `app/api/routes/tasks.py` (4 handlers), `app/api/routes/governance.py` (6 handlers), `app/api/routes/evidence.py` (2 handlers), `app/api/routes/candidate.py` (6 handlers), `app/api/routes/snapshot.py` (2 handlers), `app/api/routes/contract.py` (2 handlers), `app/api/routes/workflows.py` (9 handlers). Change pattern: `user: dict = Depends(get_current_user)` → `user: AuthenticatedPrincipal = Depends(get_current_user)`. Add import: `from app.auth.types import AuthenticatedPrincipal`.
      Files: All 9 route files listed above (total ~33 handler functions)
      Verify: `python -m pytest tests/api/ tests/unit/test_agent_routes.py tests/unit/test_auth_dependencies.py -v` — all route tests pass, no type annotation errors at runtime.

- [ ] 4. Create `services/project-ai/tests/unit/test_identity_extraction.py` with 7 test cases: (1) `test_extracts_all_required_claims` - verify user_id, original_user_id, shadow_user_id, brand, roles, portal_identity, token_type, is_admin, email, platforms, subscriptions are all extracted; (2) `test_handles_optional_claims_missing` - verify optional fields (brand, portal_identity, email, platforms, subscriptions) default correctly when absent from token; (3) `test_userid_fallback_to_sub` - verify user_id extracts from 'sub' when 'userId' missing (backward compat); (4) `test_empty_lists_for_missing_arrays` - verify roles/platforms/subscriptions default to [] not None; (5) `test_admin_token_extracts_all_claims` - verify admin tokens (tokenType='admin', isAdmin=true) work; (6) `test_portal_identity_values` - verify portal_identity accepts 'admin', 'user', 'faculty', 'super_admin', 'infrastructure'; (7) `test_brand_field_extraction` - verify brand field extracted for brand isolation (Wave 1C dependency).
      Files: `services/project-ai/tests/unit/test_identity_extraction.py` (new file, ~200 lines)
      Verify: `pytest tests/unit/test_identity_extraction.py -v` — all 7 new tests pass.

- [ ] 5. Add "Identity Claims" section to `services/project-ai/README.md` after line 165 (after "### Admin Token Support" section, before "### Security Notes"). Document the 11 extracted claims, their types, which are required vs optional, and their purpose for Wave 1C/1D. Include example showing `AuthenticatedPrincipal` structure and note that `get_current_user()` returns this typed dict.
      Files: `services/project-ai/README.md` (insert after line 165)
      Verify: `cat services/project-ai/README.md | grep -A 20 "Identity Claims"` — section exists with all 11 claims documented.

- [ ] 6. Run full auth test suite to verify no regressions. Run: `pytest tests/unit/test_auth_*.py tests/unit/test_identity_extraction.py --cov=app/auth --cov-report=term`. Confirm all tests pass (14 existing + 7 new = 21 total) and coverage includes new identity extraction code paths.
      Files: N/A (verification only)
      Verify: `pytest tests/unit/test_auth_*.py tests/unit/test_identity_extraction.py --cov=app/auth --cov-report=term` — 21+ tests pass, coverage ≥80% for app/auth/dependencies.py and app/auth/types.py.

- [ ] 7. Commit changes with message: `feat(auth): extract complete identity claims from SHC tokens (Wave 1B)`. Stage files: `app/auth/types.py`, `app/auth/dependencies.py`, all 9 route files, `tests/unit/test_identity_extraction.py`, `README.md`. Create single atomic commit on branch `m2-project-ai-canonical-wiring`.
      Files: All modified files (13 total: 1 new types.py, 1 modified dependencies.py, 9 route files, 1 new test file, 1 README.md)
      Verify: `git log --oneline -1` — shows commit message `feat(auth): extract complete identity claims from SHC tokens (Wave 1B)`. `git diff HEAD~1 --stat` — shows 13 files changed.

## Key Design Decisions

**Decision 1: Use TypedDict, not Pydantic or dataclass**
- Rationale: Task explicitly requires TypedDict. Existing codebase already uses TypedDict (seen in `app/evidence/ledger.py`). TypedDict provides type hints for IDEs without runtime overhead. FastAPI dependency injection works with plain dicts, no need for Pydantic model conversion.

**Decision 2: Extract claims in dependencies.py, not jwt.py**
- Rationale: `decode_access_token()` in jwt.py is responsible for cryptographic validation and security checks (signature, expiration, required claims). `get_current_user()` in dependencies.py is responsible for shaping the identity dict for application use. This maintains separation of concerns—jwt.py knows nothing about application-level identity shape.

**Decision 3: No breaking changes to existing routes**
- Rationale: Routes currently receive dict with 4 keys. New implementation adds 7 more keys but keeps the existing 4 with same names. All existing code using `user["user_id"]`, `user["roles"]`, etc. continues to work. Type annotation change from `dict` to `AuthenticatedPrincipal` is non-breaking (dict is compatible with TypedDict at runtime).

**Decision 4: Default [] for array fields, not None**
- Rationale: Simplifies consumer code—no need to check `if user["roles"]` before iterating. TypeScript token contract shows `roles: string[]` (required) and `platforms?: Array<...>` (optional), so roles should never be None. For missing optional arrays, empty list is safer than None.

**Decision 5: Keep userId → user_id remapping with sub fallback**
- Rationale: Existing code already does this (lines 49-51 of dependencies.py). SHC tokens use `userId` as primary identifier, but some legacy tokens may have `sub` only. Fallback maintains backward compatibility.

**Decision 6: Create new test file instead of extending existing**
- Rationale: Existing `test_auth_dependencies.py` tests the dependency injection mechanics (valid tokens, missing headers, invalid formats, role requirements). New `test_identity_extraction.py` tests the completeness and correctness of identity claim extraction—different concerns, cleaner separation.

## Edge Cases Handled

1. **Missing userId and sub**: Token validation already enforces `userId` is required (jwt.py line 157), so this cannot happen with valid tokens. Fallback to `sub` is defensive for legacy tokens.

2. **Optional fields (brand, portalIdentity, email)**: Use `.get()` with no default (returns None), matching TypedDict's `Optional[str]` type.

3. **Array fields (roles, platforms, subscriptions)**: Use `.get(key, [])` to ensure empty list instead of None. `roles` is required by jwt.py validation but use defensive default anyway.

4. **Shadow identity claims (originalUserId, shadowUserId)**: These are required by jwt.py validation (lines 157-158), so will always be present. Use `.get()` with no default for type consistency (TypedDict shows Optional).

5. **Admin tokens**: No special handling needed—`isAdmin` and `tokenType` already extracted, new code just adds more fields from same payload.

## Verification Strategy

- Step 1: Module import test (no syntax errors, TypedDict defined correctly)
- Step 2: Existing unit tests must pass (no breaking changes)
- Step 3: Route tests verify handlers accept new type annotation
- Step 4: New tests verify all 11 claims extracted correctly
- Step 5: Manual grep verification (documentation exists)
- Step 6: Coverage test (all code paths exercised)
- Step 7: Git verification (commit exists with correct message and files)

## Dependencies

- No external dependencies to install (TypedDict is stdlib `typing` module)
- No schema migrations (no database changes)
- No configuration changes (no env vars added)
- Wave 1C and Wave 1D depend on this wave completing successfully
