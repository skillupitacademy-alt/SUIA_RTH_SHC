# Wave 1B Verification Report

**Date**: 2026-10-10
**Verified Commit**: f41b4a6cd0ef74ae475b8e0d933424d441523c48 (remote HEAD)
**Wave 1B Commit**: 30ab1ad5ecbacbcd6bcea67656d27b0955aaedb7 (one commit behind HEAD)
**Verification Status**: PARTIAL

## Executive Summary

Wave 1B implementation is present and functional but contains one critical defect (P0) and several documentation/testing gaps (P1). The core identity extraction works correctly for tokens that include all required claims. However, the documented `sub` fallback behavior is dead code that can never execute due to earlier validation. Auth test coverage is 91%, not the claimed 93%. Route files were modified, not newly created as the prior review claimed.

## Commit Verification

**Status**: PASS
**Remote HEAD SHA**: f41b4a6cd0ef74ae475b8e0d933424d441523c48
**Claimed SHA 30ab1ad5**: Present on remote branch, one commit behind current HEAD
**Evidence**: 
```
f41b4a6c (HEAD -> m2-project-ai-canonical-wiring, origin/m2-project-ai-canonical-wiring) chore(wave1b): add identity extraction evidence and review approval
30ab1ad5 feat(auth): extract complete identity claims from SHC tokens (Wave 1B)
```

The claimed commit exists and contains the Wave 1B implementation. The current HEAD adds evidence and review documents but does not change the implementation itself.

## P0: userId/sub Fallback

**Status**: FAIL - DEAD CODE
**jwt.py validation**: Lines 139-143
```python
# Validate required identity claims
required_claims = ["userId", "originalUserId", "shadowUserId"]
for claim in required_claims:
    claim_value = payload.get(claim)
    if not isinstance(claim_value, str) or not claim_value.strip():
        raise HTTPException(
            status_code=401,
            detail=f"Missing or invalid {claim} claim"
        )
```

**get_current_user() fallback**: Lines 56-58 in dependencies.py
```python
# Extract user_id from userId claim (SHC standard), fallback to sub for backward compatibility
user_id = payload.get("userId")
if not user_id:
    user_id = payload.get("sub")
```

**test_userid_fallback_to_sub token structure**: Lines 266-283 in test_identity_extraction.py
```python
data_with_both = {
    "sub": "fallback_user",
    "userId": "primary_user",
    "originalUserId": "primary_user",
    "shadowUserId": "primary_user",
    "aud": "user",
    "tokenType": "user",
    "roles": ["contract_viewer"]
}
```

**Conclusion**: DEAD CODE - The fallback logic can never execute.

The JWT verifier (`jwt.py`) requires `userId` to be a non-empty string at line 139-143. Any token missing `userId` is rejected with a 401 error before reaching `get_current_user()`. The fallback logic in `dependencies.py` lines 56-58 is therefore unreachable.

The test `test_userid_fallback_to_sub` does not test the fallback scenario. It includes both `userId` and `sub` in the token, then asserts that `userId` takes precedence. This tests precedence, not fallback when `userId` is absent.

**Recommendation**: 
1. **Option A (Strict)**: Remove the fallback code from `dependencies.py` and update the docstring to remove the "fallback to sub for backward compatibility" claim. Remove or rename the test to reflect what it actually tests (precedence, not fallback).
2. **Option B (Permissive)**: Relax the JWT validator to allow `userId` to be optional, then add a real fallback test that omits `userId` entirely and verifies that `sub` is used. This weakens the identity validation contract.

**Recommended choice**: Option A. The current strict validation is correct for SHC tokens. The fallback claim should be removed, not implemented.

## P1a: Runtime Type Validation

**Status**: FAIL - No runtime validation for claim types
**roles extraction**: Line 60 in dependencies.py
```python
"roles": payload.get("roles", []),
```

**portal_identity extraction**: Line 61 in dependencies.py
```python
"portal_identity": payload.get("portalIdentity"),
```

**token_type extraction**: Line 62 in dependencies.py
```python
"token_type": payload.get("tokenType"),
```

**platforms extraction**: Line 65 in dependencies.py
```python
"platforms": payload.get("platforms", []),
```

**subscriptions extraction**: Line 66 in dependencies.py
```python
"subscriptions": payload.get("subscriptions", [])
```

**Malformed-claim tests**: ABSENT - No tests verify behavior when claims have wrong types

**Risk**: If a JWT contains `"roles": "admin"` (string instead of list), the code will pass it through without validation. Downstream code expecting a list would fail. Similarly, `portal_identity` could be an arbitrary string outside the Literal type, and `platforms`/`subscriptions` could be non-list values.

**Recommendation**: Add runtime validation in `get_current_user()`:
- Verify `roles` is a list before returning
- Verify `portal_identity` is one of the allowed literal values or None
- Verify `token_type` is "user" or "admin" (this is validated in jwt.py, so redundant check)
- Verify `platforms` and `subscriptions` are lists

Add malformed-claim tests that pass tokens with:
- `"roles": "admin"` (string not list)
- `"portal_identity": "hacker"` (invalid literal)
- `"platforms": "web"` (string not list)

## P1b: Route Handler Changes

**Status**: CORRECTED
**git diff output**:
```
M	services/project-ai/app/api/routes/agents.py
M	services/project-ai/app/api/routes/candidate.py
M	services/project-ai/app/api/routes/contract.py
M	services/project-ai/app/api/routes/evidence.py
M	services/project-ai/app/api/routes/governance.py
M	services/project-ai/app/api/routes/snapshot.py
M	services/project-ai/app/api/routes/tasks.py
M	services/project-ai/app/api/routes/workflows.py
```

**Prior claim**: "all route handlers are new files; no existing handlers modified"

**Actual finding**: All 8 route files were MODIFIED (M), not added (A). Git status clearly shows these are modifications to existing files, not new files. The changes updated type annotations from `dict` to `AuthenticatedPrincipal` in route handler signatures.

This contradicts the claim in the existing wave1b-review.md document. The review should be corrected to state that existing route files were modified to adopt the new principal type.

## Auth Test Count Verification

**Status**: PASS (count matches, coverage slightly lower than claimed)
**Claimed auth tests**: 26
**Actual auth tests collected**: 26
**Test breakdown**:
- `test_auth_dependencies.py`: 10 tests
- `test_auth_jwt.py`: 7 tests  
- `test_identity_extraction.py`: 9 tests
- **Total**: 26 tests

**Test results**: 26 passed, 0 failed, 0 skipped

**Auth coverage claimed**: 93%
**Auth coverage actual**: 91%

**Coverage details**:
```
Name                       Stmts   Miss  Cover   Missing
--------------------------------------------------------
app\auth\__init__.py           4      0   100%
app\auth\config.py            13      3    77%   27, 33, 42
app\auth\dependencies.py      29      1    97%   52
app\auth\jwt.py               50      6    88%   115, 123, 131, 138, 143, 153
app\auth\types.py             13      0   100%
--------------------------------------------------------
TOTAL                        109     10    91%
```

The claimed 93% is close but overstated. The actual measured coverage is 91%.

## Full Test Suite Verification

**Status**: CANNOT VERIFY CLAIM
**Claimed**: 44/44 tests pass
**Actual collected in full suite**: 1102 tests

The claim that "44/44 tests pass" cannot be verified. The full test suite contains 1102 tests. When running `pytest tests/` without specific selection:
- 1102 tests are collected
- Most are skipped (the prior run showed "1102 skipped")
- This suggests tests require specific environment setup (database, credentials, etc.)

When running unit and security tests only (`tests/unit/` and `tests/security/`):
- 334 tests passed
- 13 tests skipped
- 0 failed

The "44 tests" number does not correspond to any discoverable test count in the current codebase. It may refer to:
- Tests from a specific run command not documented
- A subset of tests with specific markers
- An outdated count from an earlier implementation state

**Recommendation**: Remove the "44/44" claim from documentation unless it can be reproduced with a specific command.

## Overall Verdict

**Status**: PARTIAL - Core implementation works, but has one critical defect and documentation issues
**Blocking Issues (P0)**:
1. The `userId`/`sub` fallback logic is dead code that contradicts the JWT validation contract

**Non-blocking Issues (P1)**:
1. No runtime type validation for claim types (roles, platforms, subscriptions arrays)
2. Route handler change description is incorrect in existing review
3. Coverage is 91%, not 93%
4. The "44/44 tests" claim cannot be verified

**Recommendations before Wave 1C**:
1. **Fix P0**: Remove the dead fallback code and update documentation to remove backward-compatibility claims, OR deliberately implement the fallback by relaxing JWT validation (not recommended)
2. **Add runtime validation**: Validate that list-typed claims are actually lists, and Literal-typed claims match allowed values
3. **Add malformed-claim tests**: Test behavior when claims have incorrect types
4. **Correct the wave1b-review.md**: Update to reflect that route files were modified, not newly created
5. **Document test execution**: Provide the exact pytest command that produces "44 tests" or remove that claim

## Corrected Claims

| Original Claim | Actual Finding |
|---|---|
| Commit `30ab1ad5` is HEAD | One commit behind HEAD (`f41b4a6c`) |
| `sub` fallback works when `userId` missing | Dead code - JWT validator rejects tokens without `userId` before fallback can execute |
| Auth coverage is 93% | Auth coverage is 91% |
| All route handlers are new files | All 8 route files were modified (M), not added (A) |
| 44/44 tests pass | Cannot verify - full suite has 1102 tests; unit+security shows 334 passed |
| test_userid_fallback_to_sub tests fallback | Test includes both `userId` and `sub`, tests precedence not fallback |
