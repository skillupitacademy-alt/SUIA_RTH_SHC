# Wave 1C Security Remediation Implementation Plan

## Context

This plan addresses four security findings in the project-ai service Wave 1C implementation:
- **Finding 1 (CRITICAL)**: Unsafe infrastructure bypass - any principal with brand=None bypasses tenant checks without role verification
- **Finding 2 (HIGH)**: Legacy NULL brand candidates accessible to all tenants
- **Finding 3 (CONFIRMED)**: Self-approval prevention logic exists but lacks test coverage
- **Finding 4 (CONFIRMED)**: Inconsistent user_id extraction (KeyError risk in workflows.py)

All changes target the services/project-ai subtree and preserve existing test passes while adding new coverage.

---

## Implementation Steps

### Finding 1 & 2: Infrastructure Bypass and NULL Brand Candidates

- [ ] 1. **Fix infrastructure bypass in verify_brand_access**
      
      Modify `services/project-ai/app/auth/authorization.py` function `verify_brand_access()` around lines 33-36.
      
      **Current code (line 33-36):**
      ```python
      # Rule 1: Infrastructure users (brand=None) bypass brand restrictions
      if user_brand is None:
          logger.debug("Infrastructure user bypassing brand check (user brand=None)")
          return
      ```
      
      **Change to:**
      ```python
      # Rule 1: Infrastructure users (brand=None) bypass brand restrictions ONLY if privileged
      if user_brand is None:
          roles = principal.get("roles", [])
          if "super_admin" not in roles and "infrastructure" not in roles:
              logger.warning(
                  f"Infrastructure access denied: user has brand=None but lacks required role. "
                  f"Roles: {roles}"
              )
              raise HTTPException(
                  status_code=403,
                  detail="Infrastructure access requires super_admin or infrastructure role"
              )
          logger.debug("Infrastructure user bypassing brand check (privileged role verified)")
          return
      ```
      
      Files: `services/project-ai/app/auth/authorization.py`
      
      Verify: Add unit test (see step 3), then run `pytest tests/security/test_authorization.py::TestVerifyBrandAccess -v`

- [ ] 2. **Fix NULL brand candidate execution**
      
      Modify `services/project-ai/app/api/routes/candidate.py` function `execute_placement()` around line 858 (after the `verify_brand_access(user, package.brand)` call).
      
      **Add after line 858:**
      ```python
      # Finding 2: Candidates with brand=None require privileged role
      # (legacy data or platform-level resources)
      if package.brand is None:
          roles = user.get("roles", [])
          if "super_admin" not in roles and "infrastructure" not in roles:
              raise HTTPException(
                  status_code=403,
                  detail="Access to unbranded candidates requires super_admin or infrastructure role"
              )
      ```
      
      Files: `services/project-ai/app/api/routes/candidate.py`
      
      Verify: Add integration test skeleton (see step 4), then run `pytest tests/security/test_authorization.py -v`

- [ ] 3. **Add test for infrastructure bypass role requirement**
      
      Add test to `services/project-ai/tests/security/test_authorization.py` in class `TestVerifyBrandAccess`:
      
      ```python
      def test_infrastructure_bypass_requires_privileged_role(self):
          """Infrastructure bypass (brand=None) requires super_admin or infrastructure role."""
          principal: AuthenticatedPrincipal = {
              "user_id": "user123",
              "original_user_id": None,
              "shadow_user_id": None,
              "brand": None,  # Attempting infrastructure bypass
              "roles": [],  # No privileged role
              "portal_identity": None,
              "token_type": "user",
              "is_admin": False,
              "email": None,
              "platforms": [],
              "subscriptions": []
          }
          
          with pytest.raises(HTTPException) as exc_info:
              verify_brand_access(principal, "skillhub")
          
          assert exc_info.value.status_code == 403
          assert "Infrastructure access requires" in exc_info.value.detail
      ```
      
      Files: `services/project-ai/tests/security/test_authorization.py`
      
      Verify: `pytest tests/security/test_authorization.py::TestVerifyBrandAccess::test_infrastructure_bypass_requires_privileged_role -v` — expect PASSED

- [ ] 4. **Add integration test skeleton for NULL brand candidate enforcement**
      
      Add test to `services/project-ai/tests/security/test_authorization.py` in class `TestBrandEnforcementInRoutes`:
      
      ```python
      @pytest.mark.skip(reason="Requires integration test setup with TestClient and database")
      def test_null_brand_candidate_execution_requires_privileged_role(self):
          """
          Verify NULL brand candidates cannot be executed by regular tenant users.
          
          Tests that POST /candidates/{id}/execute returns 403 when candidate.brand=None
          and executor lacks super_admin or infrastructure role.
          """
          pass
      ```
      
      Files: `services/project-ai/tests/security/test_authorization.py`
      
      Verify: `pytest tests/security/test_authorization.py::TestBrandEnforcementInRoutes -v` — expect SKIPPED with clear reason

---

### Finding 3: Self-Approval Prevention Test

- [ ] 5. **Add self-approval prevention test**
      
      Add test to `services/project-ai/tests/security/test_authorization.py` in class `TestIdentityExtractionFromJWT`:
      
      ```python
      @pytest.mark.skip(reason="Requires integration test setup with TestClient and database")
      def test_self_approval_prevention_with_jwt_identity(self):
          """
          Verify self-approval is rejected when requester_id equals approver user_id from JWT.
          
          Tests that POST /approvals/workflows/{id}/approve-placement endpoint:
          1. Extracts approver identity from JWT token (not request body)
          2. Compares approver user_id against workflow.requester_id
          3. Returns 403 with 'SELF_APPROVAL_REJECTED' when they match
          
          Test structure:
          - Create workflow with requester_id='user_alice'
          - Create JWT token for user_alice (userId='user_alice')
          - Attempt POST /approvals/workflows/{id}/approve-placement with that token
          - Expect: 403 response with detail containing 'SELF_APPROVAL_REJECTED'
          - Expect: detail shows requester and approver both equal 'user_alice'
          """
          pass
      ```
      
      Files: `services/project-ai/tests/security/test_authorization.py`
      
      Verify: `pytest tests/security/test_authorization.py::TestIdentityExtractionFromJWT::test_self_approval_prevention_with_jwt_identity -v` — expect SKIPPED with clear reason

---

### Finding 4: Inconsistent user_id Extraction

- [ ] 6. **Document user_id guarantee in dependencies.py**
      
      Review `services/project-ai/app/auth/dependencies.py` function `get_current_user()` line 89.
      
      **Current code (line 89):**
      ```python
      # Extract user_id from userId claim (required by JWT validation)
      user_id = payload["userId"]  # Direct access - jwt.py already validated non-empty
      ```
      
      **Add comment above line 89:**
      ```python
      # SECURITY: user_id is guaranteed non-empty by decode_access_token() validation
      # (see app/auth/jwt.py lines 80-85: raises HTTPException 401 if userId missing/empty)
      # Direct access is safe here; downstream handlers can rely on this guarantee.
      user_id = payload["userId"]  # Direct access - jwt.py already validated non-empty
      ```
      
      Files: `services/project-ai/app/auth/dependencies.py`
      
      Verify: Read the file, confirm comment placement

- [ ] 7. **Add defensive user_id extraction in workflows.py**
      
      Modify `services/project-ai/app/api/routes/workflows.py` line 150.
      
      **Current code (line 150):**
      ```python
      # Extract requester identity from JWT token (prevent identity spoofing)
      requester_id = user["user_id"]
      ```
      
      **Change to:**
      ```python
      # Extract requester identity from JWT token (prevent identity spoofing)
      # Defensive: user_id guaranteed by get_current_user but explicit check for clarity
      user_id = user.get("user_id")
      if not user_id:
          raise HTTPException(
              status_code=401,
              detail="Missing user_id claim in authenticated principal"
          )
      requester_id = user_id
      ```
      
      Files: `services/project-ai/app/api/routes/workflows.py`
      
      Verify: Run `pytest tests/ -k "workflow" -v` — expect all workflow tests pass

- [ ] 8. **Fix approver identity extraction in governance.py**
      
      Modify `services/project-ai/app/api/routes/governance.py` line 459.
      
      **Current code (line 459):**
      ```python
      # Extract approver identity from JWT token (prevent identity spoofing)
      approved_by = user.get("user_id") or user.get("email") or "unknown"
      ```
      
      **Change to:**
      ```python
      # Extract approver identity from JWT token (prevent identity spoofing)
      # user_id guaranteed by JWT validation; reject if absent
      approved_by = user.get("user_id")
      if not approved_by:
          raise HTTPException(
              status_code=401,
              detail="Missing user_id claim in authenticated principal"
          )
      ```
      
      Files: `services/project-ai/app/api/routes/governance.py`
      
      Verify: Run `pytest tests/ -k "governance" -v` — expect all governance tests pass

- [ ] 9. **Add test proving user_id guarantee**
      
      Add test to `services/project-ai/tests/unit/test_auth_dependencies.py`:
      
      ```python
      def test_user_id_guaranteed_by_jwt():
          """Test that get_current_user guarantees user_id from JWT userId claim."""
          from app.auth.jwt import create_access_token
          from app.auth.dependencies import get_current_user
          
          # Create JWT with userId claim
          token = create_access_token(
              {
                  "userId": "test_user_456",
                  "originalUserId": "test_user_456",
                  "shadowUserId": "test_user_456",
                  "roles": ["contract_viewer"],
                  "tokenType": "user"
              }
          )
          
          authorization = f"Bearer {token}"
          user = get_current_user(authorization)
          
          # Verify user_id is present and non-empty
          assert "user_id" in user
          assert user["user_id"] == "test_user_456"
          assert isinstance(user["user_id"], str)
          assert len(user["user_id"]) > 0
      ```
      
      Files: `services/project-ai/tests/unit/test_auth_dependencies.py`
      
      Verify: `pytest tests/unit/test_auth_dependencies.py::test_user_id_guaranteed_by_jwt -v` — expect PASSED

---

## Final Verification

- [ ] 10. **Run full security test suite with coverage**
      
      Command: `cd services/project-ai && pytest tests/security/ -v --cov=app/auth --cov-report=term`
      
      Expected outcome:
      - All existing ~20 Wave 1C tests pass
      - 3 new tests added: 1 passing (infrastructure bypass), 2 skipped (integration stubs)
      - Total: ≥21 tests collected, ≥19 passed, 2 skipped
      - Coverage: app/auth/authorization.py ≥ 90%, app/auth/dependencies.py ≥ 85%
      
      Files: N/A (test execution)
      
      Verify: Check pytest output for test count, pass/skip/fail status, and coverage percentages

---

## Notes

### Rationale for Findings Priority

**Finding 1 (CRITICAL)**: Any user with brand=None bypasses all tenant checks, creating a trivial tenant boundary escape. Must verify privileged role before allowing bypass.

**Finding 2 (HIGH)**: Legacy candidates with brand=NULL are shared across all tenants. In a strict tenant isolation model, unbranded resources must require explicit privileged access.

**Finding 3 (CONFIRMED)**: Self-approval logic exists in governance.py (lines 461-469) but no test proves it works. The existing test suite shows 9 skipped integration tests; this adds proper test structure.

**Finding 4 (CONFIRMED)**: workflows.py uses `user["user_id"]` (KeyError risk), governance.py uses `.get()` fallback. Inconsistent patterns create maintenance burden. JWT validation guarantees user_id, so defensive checks are documentation, not runtime necessity.

### Test Strategy

- Unit tests prove authorization logic (verify_brand_access, role checks)
- Integration test skeletons document expected route-level enforcement
- Skipped tests have clear reasons and show test structure for future implementation
- Existing Wave 1C tests continue to pass (backward compatibility)

### Security Model

- **Tenant isolation**: brand field enforces tenant boundaries at resource level
- **Infrastructure privilege**: brand=None requires super_admin or infrastructure role
- **Self-approval prevention**: requester_id ≠ approver user_id enforced via JWT identity
- **Identity trust**: get_current_user() is the sole source of truth for user identity
