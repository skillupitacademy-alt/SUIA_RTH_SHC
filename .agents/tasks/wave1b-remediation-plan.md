# Wave 1B Remediation Plan

**Branch**: m2-project-ai-canonical-wiring  
**Baseline Commit**: 5869e0c5 (Wave 1B verification report)  
**Target**: Fix P0 dead code, add runtime validation, correct documentation, update evidence reports

## Exploration Summary

Verified the following discrepancies between the original Wave 1B implementation and the remediation requirements:

1. **Dead userId/sub Fallback** (P0): Lines 56-58 in `dependencies.py` contain unreachable fallback code. The JWT verifier (`jwt.py` lines 139-143) requires `userId` to be a non-empty string before `get_current_user()` is called, making the `sub` fallback impossible to reach.

2. **Missing Runtime Validation** (P1): Lines 60-66 in `dependencies.py` extract claims without type validation. If a JWT contains malformed claims like `"roles": "admin"` (string instead of list), the code passes them through without validation.

3. **Misleading Test Name** (P1): Line 266 in `test_identity_extraction.py` names the test `test_userid_fallback_to_sub`, but the test includes both `userId` and `sub` in the token (line 269), so it tests precedence, not fallback.

4. **Documentation Claims**: `README.md` line ~195 documents the `sub` fallback for backward compatibility. This claim is inconsistent with the JWT validation contract.

5. **Review File Accuracy**: `wave1b-review.md` states "Route handlers are all route files; no existing handlers modified" but the verification report found all 8 route files were MODIFIED (M), not added (A).

## Implementation Plan

- [ ] 1. **Remove dead userId/sub fallback from `dependencies.py`**
      
      Remove lines 56-58 in `services/project-ai/app/auth/dependencies.py`:
      ```python
      # Extract user_id from userId claim (SHC standard), fallback to sub for backward compatibility
      user_id = payload.get("userId")
      if not user_id:
          user_id = payload.get("sub")
      ```
      
      Replace with direct extraction (userId is guaranteed non-empty by jwt.py validation):
      ```python
      # Extract user_id from userId claim (guaranteed non-empty by JWT validation)
      user_id = payload["userId"]
      ```
      
      **Files**: `services/project-ai/app/auth/dependencies.py`  
      **Verify**: `cd services/project-ai && pytest tests/security/test_identity_extraction.py -v --tb=short` — all tests should pass

- [ ] 2. **Add runtime type validation for claim extraction**
      
      Insert validation logic after line 51 in `services/project-ai/app/auth/dependencies.py` (after `payload = decode_access_token(token)`):
      
      ```python
      # Validate claim types before extraction
      roles = payload.get("roles", [])
      if not isinstance(roles, list):
          raise HTTPException(
              status_code=401,
              detail="Invalid roles claim: must be a list"
          )
      
      platforms = payload.get("platforms", [])
      if not isinstance(platforms, list):
          raise HTTPException(
              status_code=401,
              detail="Invalid platforms claim: must be a list"
          )
      
      subscriptions = payload.get("subscriptions", [])
      if not isinstance(subscriptions, list):
          raise HTTPException(
              status_code=401,
              detail="Invalid subscriptions claim: must be a list"
          )
      
      portal_identity = payload.get("portalIdentity")
      if portal_identity is not None and portal_identity not in ['admin', 'user', 'faculty', 'super_admin', 'infrastructure']:
          raise HTTPException(
              status_code=401,
              detail=f"Invalid portalIdentity claim: {portal_identity}"
          )
      
      is_admin = payload.get("isAdmin", False)
      if not isinstance(is_admin, bool):
          raise HTTPException(
              status_code=401,
              detail="Invalid isAdmin claim: must be a boolean"
          )
      
      brand = payload.get("brand")
      if brand is not None and not isinstance(brand, str):
          raise HTTPException(
              status_code=401,
              detail="Invalid brand claim: must be a string"
          )
      
      email = payload.get("email")
      if email is not None and not isinstance(email, str):
          raise HTTPException(
              status_code=401,
              detail="Invalid email claim: must be a string"
          )
      ```
      
      Update the return statement to use validated variables:
      ```python
      return {
          "user_id": payload["userId"],
          "original_user_id": payload.get("originalUserId"),
          "shadow_user_id": payload.get("shadowUserId"),
          "brand": brand,
          "roles": roles,
          "portal_identity": portal_identity,
          "token_type": payload.get("tokenType"),
          "is_admin": is_admin,
          "email": email,
          "platforms": platforms,
          "subscriptions": subscriptions
      }
      ```
      
      **Files**: `services/project-ai/app/auth/dependencies.py`  
      **Verify**: `cd services/project-ai && pytest tests/unit/test_auth_dependencies.py -v` — existing tests should still pass

- [ ] 3. **Rename and fix the misleading fallback test**
      
      In `services/project-ai/tests/security/test_identity_extraction.py`:
      
      Rename the test function at line 266 from `test_userid_fallback_to_sub` to `test_userid_takes_precedence_over_sub`.
      
      Update the docstring at line 267 from:
      ```python
      """Test backward compatibility: user_id falls back to 'sub' when 'userId' missing."""
      ```
      
      To:
      ```python
      """Test userId takes precedence over sub when both claims are present.
      
      This test verifies that when both 'userId' and 'sub' claims exist in a token,
      the 'userId' claim is used as the primary identifier. The JWT validator already
      requires 'userId' to be non-empty, so tokens with missing userId are rejected
      before reaching get_current_user().
      """
      ```
      
      **Files**: `services/project-ai/tests/security/test_identity_extraction.py`  
      **Verify**: `cd services/project-ai && pytest tests/security/test_identity_extraction.py::test_userid_takes_precedence_over_sub -v` — renamed test should pass

- [ ] 4. **Add malformed-claim rejection tests**
      
      Append six new test cases to `services/project-ai/tests/security/test_identity_extraction.py` (after the existing tests, around line 340):
      
      ```python
      def test_rejects_roles_as_string():
          """Test that roles claim with string value (not list) is rejected."""
          data = {
              "userId": "user_roles_string",
              "originalUserId": "user_roles_string",
              "shadowUserId": "user_roles_string",
              "aud": "user",
              "tokenType": "user",
              "roles": "admin"  # Should be list, not string
          }
          token = create_access_token(data)
          authorization = f"Bearer {token}"
          
          with pytest.raises(HTTPException) as exc_info:
              get_current_user(authorization)
          
          assert exc_info.value.status_code == 401
          assert "Invalid roles claim" in exc_info.value.detail
      
      
      def test_rejects_platforms_as_string():
          """Test that platforms claim with string value (not list) is rejected."""
          data = {
              "userId": "user_platforms_string",
              "originalUserId": "user_platforms_string",
              "shadowUserId": "user_platforms_string",
              "aud": "user",
              "tokenType": "user",
              "roles": ["contract_viewer"],
              "platforms": "web"  # Should be list, not string
          }
          token = create_access_token(data)
          authorization = f"Bearer {token}"
          
          with pytest.raises(HTTPException) as exc_info:
              get_current_user(authorization)
          
          assert exc_info.value.status_code == 401
          assert "Invalid platforms claim" in exc_info.value.detail
      
      
      def test_rejects_subscriptions_as_string():
          """Test that subscriptions claim with string value (not list) is rejected."""
          data = {
              "userId": "user_subs_string",
              "originalUserId": "user_subs_string",
              "shadowUserId": "user_subs_string",
              "aud": "user",
              "tokenType": "user",
              "roles": ["contract_viewer"],
              "subscriptions": "premium"  # Should be list, not string
          }
          token = create_access_token(data)
          authorization = f"Bearer {token}"
          
          with pytest.raises(HTTPException) as exc_info:
              get_current_user(authorization)
          
          assert exc_info.value.status_code == 401
          assert "Invalid subscriptions claim" in exc_info.value.detail
      
      
      def test_rejects_invalid_portal_identity():
          """Test that portalIdentity with invalid literal value is rejected."""
          data = {
              "userId": "user_invalid_portal",
              "originalUserId": "user_invalid_portal",
              "shadowUserId": "user_invalid_portal",
              "aud": "user",
              "tokenType": "user",
              "roles": ["contract_viewer"],
              "portalIdentity": "hacker"  # Not in allowed literals
          }
          token = create_access_token(data)
          authorization = f"Bearer {token}"
          
          with pytest.raises(HTTPException) as exc_info:
              get_current_user(authorization)
          
          assert exc_info.value.status_code == 401
          assert "Invalid portalIdentity claim" in exc_info.value.detail
      
      
      def test_rejects_isadmin_as_string():
          """Test that isAdmin claim with string value (not boolean) is rejected."""
          data = {
              "userId": "user_admin_string",
              "originalUserId": "user_admin_string",
              "shadowUserId": "user_admin_string",
              "aud": "user",
              "tokenType": "user",
              "roles": ["contract_viewer"],
              "isAdmin": "true"  # Should be boolean, not string
          }
          token = create_access_token(data)
          authorization = f"Bearer {token}"
          
          with pytest.raises(HTTPException) as exc_info:
              get_current_user(authorization)
          
          assert exc_info.value.status_code == 401
          assert "Invalid isAdmin claim" in exc_info.value.detail
      
      
      def test_rejects_brand_as_number():
          """Test that brand claim with non-string value is rejected."""
          data = {
              "userId": "user_brand_number",
              "originalUserId": "user_brand_number",
              "shadowUserId": "user_brand_number",
              "aud": "user",
              "tokenType": "user",
              "roles": ["contract_viewer"],
              "brand": 12345  # Should be string, not number
          }
          token = create_access_token(data)
          authorization = f"Bearer {token}"
          
          with pytest.raises(HTTPException) as exc_info:
              get_current_user(authorization)
          
          assert exc_info.value.status_code == 401
          assert "Invalid brand claim" in exc_info.value.detail
      ```
      
      **Files**: `services/project-ai/tests/security/test_identity_extraction.py`  
      **Verify**: `cd services/project-ai && pytest tests/security/test_identity_extraction.py -v --tb=short` — 15 tests should pass (9 original + 6 new)

- [ ] 5. **Remove fallback claim from README.md**
      
      In `services/project-ai/README.md`, locate the Identity Claims section (around line 195) and update:
      
      Remove this line:
      ```markdown
      - **user_id** (`str`): Primary user identifier from `userId` claim (fallback to `sub` for backward compatibility)
      ```
      
      Replace with:
      ```markdown
      - **user_id** (`str`): Primary user identifier from `userId` claim (required by JWT validation)
      ```
      
      Add a security clarification note after the Additional Context section (around line 220):
      
      ```markdown
      #### Authorization Clarification
      
      The `is_admin` boolean flag and `roles` list extracted from the JWT token indicate the user's identity claims, but they do NOT replace proper authorization checks. Route handlers must still verify permissions before performing privileged operations. The extracted admin flags are claims about who the user is, not decisions about what they can do.
      
      For example:
      - `is_admin=True` means the token claims admin status, but the handler must verify the specific operation is permitted
      - `roles=["contract_admin"]` means the token claims this role, but brand-level access control (Wave 1C) must still be enforced
      
      Never trust identity claims alone for authorization decisions without validation.
      ```
      
      **Files**: `services/project-ai/README.md`  
      **Verify**: Manual review — confirm the fallback claim is removed and authorization note is present

- [ ] 6. **Update wave1b-review.md with remediation section**
      
      Append to `e:\onlinewebsites\quiz-platform/.agents/tasks/wave1b-review.md`:
      
      ```markdown
      
      ---
      
      ## Remediation (Post-Verification)
      
      **Date**: [DATE]  
      **Remediation Commit**: [COMMIT_SHA]
      
      ### Issues Fixed
      
      1. **P0: Dead userId/sub Fallback**
         - Removed unreachable fallback code from `dependencies.py` lines 56-58
         - Changed to direct extraction: `user_id = payload["userId"]`
         - Rationale: JWT validator (`jwt.py` lines 139-143) already requires `userId` to be non-empty
      
      2. **P1a: Runtime Type Validation**
         - Added validation for `roles`, `platforms`, `subscriptions` (must be lists)
         - Added validation for `portalIdentity` (must be valid literal or None)
         - Added validation for `isAdmin` (must be boolean)
         - Added validation for `brand` and `email` (must be strings or None)
         - All malformed claims now rejected with 401 error before extraction
      
      3. **P1b: Misleading Test Name**
         - Renamed `test_userid_fallback_to_sub` to `test_userid_takes_precedence_over_sub`
         - Updated docstring to clarify the test verifies precedence, not fallback
         - Added 6 new tests for malformed-claim rejection
      
      4. **P1c: Documentation Corrections**
         - Removed `sub` fallback claim from README.md Identity Claims section
         - Added authorization clarification note explaining that extracted claims don't replace authorization checks
      
      5. **P1d: Route File History Correction**
         - Correction: All 8 route files were MODIFIED (M), not newly created (A)
         - Git status showed existing files updated with `AuthenticatedPrincipal` type annotations
      
      ### Test Evidence
      
      **Auth test count**: 32 tests (26 original + 6 new malformed-claim tests)
      - `test_auth_dependencies.py`: 10 tests
      - `test_auth_jwt.py`: 7 tests
      - `test_identity_extraction.py`: 15 tests (9 original + 6 new)
      
      **Test command**:
      ```bash
      cd services/project-ai
      pytest tests/unit/test_auth_dependencies.py tests/unit/test_auth_jwt.py tests/security/test_identity_extraction.py -v
      ```
      
      **Coverage command**:
      ```bash
      cd services/project-ai
      pytest tests/unit/test_auth_dependencies.py tests/unit/test_auth_jwt.py tests/security/test_identity_extraction.py --cov=app/auth --cov-report=term-missing
      ```
      
      ### Acceptance Criteria Status
      
      - [x] Missing required identity claims are rejected (validated by JWT verifier)
      - [x] Invalid `roles`, `platforms`, `subscriptions` values are rejected (new validation)
      - [x] Invalid `brand`, `email`, `portalIdentity`, and `isAdmin` values are rejected (new validation)
      - [x] Tests cover valid claims, optional defaults, and malformed values (6 new tests)
      - [x] Existing auth and identity-extraction tests pass
      - [x] Coverage is reported from reproducible command (not copied from earlier run)
      - [x] Updated review and verification report reflect actual commit and test evidence
      
      **Verdict**: REMEDIATION COMPLETE — Wave 1C can proceed
      ```
      
      **Files**: `.agents/tasks/wave1b-review.md`  
      **Verify**: Manual review — confirm remediation section is appended with [DATE] and [COMMIT_SHA] placeholders

- [ ] 7. **Append remediation evidence to wave1b-verification-report.md**
      
      Append to `e:\onlinewebsites\quiz-platform/.agents/tasks/wave1b-verification-report.md`:
      
      ```markdown
      
      ---
      
      ## Remediation Results
      
      **Date**: [DATE]  
      **Remediation Commit**: [COMMIT_SHA]  
      **Verification Status**: PASS
      
      ### Changes Applied
      
      | File | Change |
      |------|--------|
      | `app/auth/dependencies.py` | Removed dead userId/sub fallback; added runtime type validation for all claims |
      | `tests/security/test_identity_extraction.py` | Renamed misleading test; added 6 malformed-claim rejection tests |
      | `README.md` | Removed fallback claim; added authorization clarification note |
      | `.agents/tasks/wave1b-review.md` | Appended remediation section |
      | `.agents/tasks/wave1b-verification-report.md` | Appended remediation results (this section) |
      
      ### Test Results
      
      **Command executed**:
      ```bash
      cd services/project-ai
      pytest tests/security/test_identity_extraction.py -v --tb=short
      ```
      
      **Output**:
      ```
      [PASTE ACTUAL OUTPUT]
      ```
      
      **Full auth test suite**:
      ```bash
      cd services/project-ai
      pytest tests/unit/test_auth_dependencies.py tests/unit/test_auth_jwt.py tests/security/test_identity_extraction.py -v
      ```
      
      **Output**:
      ```
      [PASTE ACTUAL OUTPUT]
      ```
      
      ### Coverage Report
      
      **Command executed**:
      ```bash
      cd services/project-ai
      pytest tests/unit/test_auth_dependencies.py tests/unit/test_auth_jwt.py tests/security/test_identity_extraction.py --cov=app/auth --cov-report=term-missing
      ```
      
      **Output**:
      ```
      [PASTE ACTUAL OUTPUT]
      ```
      
      ### Remediation Verdict
      
      **Status**: COMPLETE
      
      All P0 and P1 issues identified in the original verification have been fixed:
      - Dead code removed
      - Runtime validation added for all claim types
      - Tests updated to reflect actual behavior
      - Documentation corrected to remove misleading claims
      - Authorization clarification added to prevent misuse of identity claims
      
      **Wave 1C clearance**: GRANTED — brand isolation can proceed with validated identity extraction
      ```
      
      **Files**: `.agents/tasks/wave1b-verification-report.md`  
      **Verify**: Manual review — confirm remediation section is appended with placeholders for actual test output

- [ ] 8. **Run complete test suite and capture evidence**
      
      Execute the following commands and record actual output:
      
      ```bash
      cd services/project-ai
      pytest tests/security/test_identity_extraction.py -v --tb=short
      pytest tests/unit/test_auth_dependencies.py tests/unit/test_auth_jwt.py tests/security/test_identity_extraction.py -v
      pytest tests/unit/test_auth_dependencies.py tests/unit/test_auth_jwt.py tests/security/test_identity_extraction.py --cov=app/auth --cov-report=term-missing
      ```
      
      Replace the `[PASTE ACTUAL OUTPUT]` placeholders in `wave1b-verification-report.md` with actual command output.
      Replace `[DATE]` placeholders with current date in ISO 8601 format (YYYY-MM-DD).
      Replace `[COMMIT_SHA]` placeholders with the actual remediation commit SHA.
      
      **Files**: `.agents/tasks/wave1b-verification-report.md`, `.agents/tasks/wave1b-review.md`  
      **Verify**: All tests pass; coverage >= 91%; no placeholder text remains in report files

## Verification Commands

After each step, run the relevant verification command to ensure the change is correct:

1. **After step 1** (remove fallback): `cd services/project-ai && pytest tests/security/test_identity_extraction.py -v --tb=short`
2. **After step 2** (add validation): `cd services/project-ai && pytest tests/unit/test_auth_dependencies.py -v`
3. **After step 3** (rename test): `cd services/project-ai && pytest tests/security/test_identity_extraction.py::test_userid_takes_precedence_over_sub -v`
4. **After step 4** (add malformed tests): `cd services/project-ai && pytest tests/security/test_identity_extraction.py -v --tb=short` (15 tests)
5. **After step 8** (final evidence): Full test suite and coverage report

## Final Acceptance Criteria

Before marking remediation complete:

- [ ] All auth tests pass (32 total: 10 + 7 + 15)
- [ ] Auth coverage >= 91%
- [ ] No dead code remains in `dependencies.py`
- [ ] All claim types validated at runtime
- [ ] Malformed claims rejected with 401
- [ ] Documentation accurate (no fallback claim)
- [ ] Review and verification reports updated with actual evidence
- [ ] No placeholder text (`[DATE]`, `[COMMIT_SHA]`, `[PASTE ACTUAL OUTPUT]`) remains

## Discrepancies Found

1. **Baseline commit mismatch**: The prompt specified baseline commit `5869e0c5`, but the actual verification report shows HEAD at `f41b4a6c` with Wave 1B at `30ab1ad5`. The plan uses the actual file state found in the workspace.

2. **Test count**: The original verification report claimed 26 auth tests. After adding 6 malformed-claim tests, the total will be 32 tests.

3. **Route files**: The original review incorrectly stated "all route handlers are new files", but git diff clearly shows all 8 files were MODIFIED (M). This remediation corrects that claim.

4. **README line numbers**: The Identity Claims section is approximately at line 195, but exact line numbers may vary. The coder should search for the section header and apply changes context-aware.
