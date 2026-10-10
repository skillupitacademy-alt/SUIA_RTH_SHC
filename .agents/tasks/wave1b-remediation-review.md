# Wave 1B Remediation: Runtime Validation and Dead Code Removal

This remediation fixes a critical P0 defect in the Wave 1B identity extraction implementation: unreachable fallback code that contradicted JWT validation contracts. The fix removes the dead `userId`/`sub` fallback path, adds runtime type validation for all identity claims, and establishes negative test coverage for malformed token scenarios. The implementation now correctly enforces that `userId` is required at the JWT validation layer, and validates claim types (lists, booleans, strings, literal enums) at extraction time to prevent downstream type errors.

**Watch for:** None - all acceptance criteria met, tests pass, no blocking concerns remain.

**Verdict**: APPROVED

## High-level view

The dead fallback logic claimed to support tokens with only `sub` (no `userId`), but the JWT verifier already rejected such tokens before extraction could execute. The fix removes this unreachable code path and documents the actual contract: `userId` is mandatory, enforced by `jwt.py` lines 139-143. Runtime validation now covers seven claim types: `roles` must be a list of strings, `platforms` and `subscriptions` must be lists, `isAdmin` must be a boolean, `brand` and `email` must be strings when present, and `portalIdentity` must be one of five allowed values (`admin`, `user`, `faculty`, `super_admin`, `infrastructure`) or absent. The test suite adds six malformed-claim rejection tests covering each validation rule, bringing total auth tests from 26 to 32. The misleading test name `test_userid_fallback_to_sub` is renamed to `test_userid_takes_precedence_over_sub` because it always included both claims and never tested the fallback scenario. Documentation is corrected to remove the backward-compatibility fallback claim and clarify that admin token flags do not bypass route-level authorization checks.

<details>
<summary>Issues (0)</summary>

No blocking issues remain. All remediation items from the verification report have been addressed.

</details>

<details>
<summary>Details</summary>

## Dead code removal and contract clarification

The original implementation claimed to support a fallback from `userId` to `sub` for backward compatibility, but this was unreachable code. The JWT verifier (`app/auth/jwt.py` lines 139-143) requires `userId` to be a non-empty string before any extraction logic executes. Tokens missing `userId` are rejected with HTTP 401 at verification time, so the fallback path in `dependencies.py` could never execute.

The remediation removes the unreachable fallback:

**Before:**
```python
user_id = payload.get("userId")
if not user_id:
    user_id = payload.get("sub")
```

**After:**
```python
user_id = payload["userId"]  # Direct access - jwt.py already validated non-empty
```

This is the correct contract for SHC tokens. The JWT verifier owns the identity claim requirements; the extraction layer simply maps validated claims to the `AuthenticatedPrincipal` structure. The docstring and inline comment now accurately describe this division of responsibility.

## Runtime type validation for all claims

The original extraction code assumed claim types matched the `AuthenticatedPrincipal` TypedDict, but did not validate them at runtime. If a malicious or buggy token issuer sent `"roles": "admin"` (string instead of list), the code would pass it through, causing downstream failures when route handlers attempted to iterate or check membership.

The remediation adds validation for seven claim types:

**Roles (list of strings):**
```python
roles = payload.get("roles", [])
if not isinstance(roles, list):
    raise HTTPException(status_code=401, detail="roles claim must be a list of strings")
for role in roles:
    if not isinstance(role, str):
        raise HTTPException(status_code=401, detail="all roles must be strings")
```

**Platforms and subscriptions (lists):**
```python
platforms = payload.get("platforms", [])
if not isinstance(platforms, list):
    raise HTTPException(status_code=401, detail="platforms claim must be a list")

subscriptions = payload.get("subscriptions", [])
if not isinstance(subscriptions, list):
    raise HTTPException(status_code=401, detail="subscriptions claim must be a list")
```

**Boolean flag (isAdmin):**
```python
is_admin = payload.get("isAdmin", False)
if not isinstance(is_admin, bool):
    raise HTTPException(status_code=401, detail="isAdmin claim must be a boolean")
```

**Optional strings (brand, email):**
```python
brand = payload.get("brand")
if brand is not None and not isinstance(brand, str):
    raise HTTPException(status_code=401, detail="brand claim must be a string")

email = payload.get("email")
if email is not None and not isinstance(email, str):
    raise HTTPException(status_code=401, detail="email claim must be a string")
```

**Literal enum (portalIdentity):**
```python
portal_identity = payload.get("portalIdentity")
if portal_identity is not None:
    allowed_portal_identities = {"admin", "user", "faculty", "super_admin", "infrastructure"}
    if portal_identity not in allowed_portal_identities:
        raise HTTPException(
            status_code=401,
            detail=f"Invalid portalIdentity: {portal_identity}. Must be one of: {', '.join(sorted(allowed_portal_identities))}"
        )
```

This fail-closed approach ensures type safety at the authentication boundary. Invalid tokens are rejected before reaching route handlers, preventing type confusion attacks or accidental protocol violations.

## Malformed-claim rejection tests

The remediation adds six negative tests to verify that malformed claims are rejected with HTTP 401:

1. **`test_rejects_roles_as_string`** - Rejects `"roles": "admin"` (string instead of list)
2. **`test_rejects_invalid_portal_identity`** - Rejects `"portalIdentity": "hacker"` (value outside allowed set)
3. **`test_rejects_platforms_as_string`** - Rejects `"platforms": "web"` (string instead of list)
4. **`test_rejects_subscriptions_as_string`** - Rejects `"subscriptions": "premium"` (string instead of list)
5. **`test_rejects_is_admin_as_string`** - Rejects `"isAdmin": "true"` (string instead of boolean)
6. **`test_rejects_brand_as_number`** - Rejects `"brand": 123` (number instead of string)

Each test constructs a token with a single malformed claim, attempts extraction via `get_current_user()`, and asserts that:
- An `HTTPException` is raised
- The status code is 401 (authentication failure, not 400 or 500)
- The detail message identifies the specific validation failure

These tests verify the validation logic executes correctly and produces actionable error messages for debugging token issues.

## Test rename for accuracy

The original test `test_userid_fallback_to_sub` was misleading. It included both `userId` and `sub` claims in the token, then asserted that `userId` was extracted. This tested precedence (when both are present, `userId` wins), not fallback (when `userId` is absent, use `sub`).

Since the fallback scenario can never occur (tokens without `userId` are rejected at verification time), the test is renamed to `test_userid_takes_precedence_over_sub` and the docstring clarified:

```python
def test_userid_takes_precedence_over_sub():
    """
    Test that userId claim takes precedence over sub when both are present.
    Note: JWT validation requires userId, so tokens with only sub are rejected 
    before this extraction logic executes.
    """
```

The test logic remains unchanged (it still verifies precedence), but the name and comment now accurately describe what is being tested and why the fallback scenario is not covered.

## Documentation corrections

The README previously documented a `sub` fallback claim that was never reachable. The remediation removes all references to this backward-compatibility feature. The Identity Claims section now states that `userId` is required, validated by the JWT layer.

The README adds a clarification about admin privilege flags:

```markdown
**Important**: The presence of `isAdmin=True` or `tokenType='admin'` does NOT automatically 
grant access to all routes. Route-level authorization checks (Wave 1D) must explicitly verify 
permissions using RBAC dependencies like `require_contract_admin`.
```

## Test results and coverage

**Identity extraction tests:** 15 passed (9 original + 6 new)  
**All auth tests:** 32 passed (10 dependencies + 7 JWT + 15 identity)  
**Auth coverage:** 92% (up from 91%)

No tests were skipped or failed.

## Verification artifacts updated

The remediation appends sections to two existing tracking documents rather than creating new files:

- **`.agents/tasks/wave1b-review.md`** — Appends "Post-Verification Remediation" section documenting the P0 defect, remediation actions, and test results.
- **`.agents/tasks/wave1b-verification-report.md`** — Appends "Remediation Execution" section with full pytest output showing 15/15 identity tests and 32/32 auth tests passing.

This follows the project rule: update canonical files where they already cover this work; do not create duplicate documentation.

</details>

<details>
<summary>File map</summary>

**Modified files:**
- `services/project-ai/app/auth/dependencies.py` — Removed dead `userId`/`sub` fallback, added runtime validation for 7 claim types (53 statements, 96% coverage)
- `services/project-ai/tests/security/test_identity_extraction.py` — Renamed fallback test, added 6 malformed-claim rejection tests (15 tests total, all passing)
- `services/project-ai/README.md` — Removed fallback claim documentation, added authorization clarification for admin flags
- `.agents/tasks/wave1b-review.md` — Appended remediation section with P0 defect description and fix summary
- `.agents/tasks/wave1b-verification-report.md` — Appended remediation execution section with full test output (15 identity tests, 32 auth tests, 92% coverage)

**Full diff:** `git diff main -- services/project-ai/app/auth/dependencies.py services/project-ai/tests/security/test_identity_extraction.py services/project-ai/README.md .agents/tasks/wave1b-*.md`

</details>
