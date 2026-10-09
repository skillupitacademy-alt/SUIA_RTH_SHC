# Implementation Plan: P0 JWT Authentication Security Fix

## Overview
Secure the project-ai service by adding JWT authentication to 35 unauthenticated endpoints. The auth infrastructure already exists in `app/auth/` with JWT token validation and dependency injection. This plan applies the existing `Depends(get_current_user)` pattern across all route files.

## Features
This work decomposes into 3 features:
1. **FEAT-001**: Update dependencies (pyjwt) and verify startup validation
2. **FEAT-002**: Secure all API endpoints with authentication
3. **FEAT-003**: Expand unit test coverage for JWT verification

---

- [ ] 1. **Update pyproject.toml to add pyjwt[crypto] dependency**
      Add `pyjwt[crypto]>=2.8.0` to the dependencies array in pyproject.toml. The existing code uses python-jose, which will remain; pyjwt is added for compliance with task specification.
      Files: `e:/onlinewebsites/quiz-platform/services/project-ai/pyproject.toml`
      Verify: Read pyproject.toml and confirm `pyjwt[crypto]>=2.8.0` appears in dependencies list.

- [ ] 2. **Verify JWT startup validation in main.py**
      Confirm that main.py lifespan function calls `app.auth.get_jwt_config()` during startup, which validates JWT_SECRET_KEY environment variable exists and is >= 32 characters (implemented in app/auth/config.py).
      Files: `e:/onlinewebsites/quiz-platform/services/project-ai/app/main.py`, `e:/onlinewebsites/quiz-platform/services/project-ai/app/auth/config.py`
      Verify: Read main.py lifespan function and confirm JWT config validation call is present. Read config.py and confirm ValueError raised if JWT_SECRET_KEY missing or too short.

- [ ] 3. **Secure workflows.py endpoints with authentication**
      Import `get_current_user` from `app.auth.dependencies`. Add `user: dict = Depends(get_current_user)` parameter to all 6 endpoints: `create_workflow`, `get_workflow`, `transition_workflow`, `get_workflow_history`, `bind_artifact`, `list_workflows`.
      Files: `e:/onlinewebsites/quiz-platform/services/project-ai/app/api/routes/workflows.py`
      Verify: Grep for `from app.auth.dependencies import get_current_user` in workflows.py. Grep for `Depends(get_current_user)` and confirm 6 matches.

- [ ] 4. **Secure contract.py endpoints and replace custom auth**
      Remove custom `verify_auth` and `verify_workflow_ownership` functions. Import `get_current_user`. Replace all `Depends(verify_auth)` and `Depends(verify_workflow_ownership)` with `Depends(get_current_user)`. Update endpoint logic to use `user['user_id']` instead of custom auth return values. Apply to both endpoints: `create_engineering_contract`, `get_engineering_contract`.
      Files: `e:/onlinewebsites/quiz-platform/services/project-ai/app/api/routes/contract.py`
      Verify: Read contract.py and confirm `verify_auth` and `verify_workflow_ownership` functions removed. Grep for `Depends(get_current_user)` and confirm 2 matches. Confirm no references to old custom auth functions remain.

- [ ] 5. **Secure candidate.py endpoints with authentication**
      Import `get_current_user`. Add `user: dict = Depends(get_current_user)` to all 8 endpoints: `upload_candidate`, `classify_candidate`, `compare_candidate`, `generate_manifest`, `get_manifest`, `list_candidates`, `execute_placement`, and any other @router decorated functions.
      Files: `e:/onlinewebsites/quiz-platform/services/project-ai/app/api/routes/candidate.py`
      Verify: Grep for `from app.auth.dependencies import get_current_user` in candidate.py. Grep for `Depends(get_current_user)` and confirm at least 8 matches.

- [ ] 6. **Secure governance.py endpoints with authentication**
      Import `get_current_user`. Add `user: dict = Depends(get_current_user)` to all 7 endpoints: `submit_for_approval`, `get_pending_approvals`, `get_approval_status`, `approve_manifest`, `approve_placement`, `get_implementation_approval`, `reject_manifest`.
      Files: `e:/onlinewebsites/quiz-platform/services/project-ai/app/api/routes/governance.py`
      Verify: Grep for `from app.auth.dependencies import get_current_user` in governance.py. Grep for `Depends(get_current_user)` and confirm 7 matches.

- [ ] 7. **Secure tasks.py, agents.py, evidence.py, snapshot.py endpoints**
      For each file: import `get_current_user`, add `user: dict = Depends(get_current_user)` to all endpoints.
      - tasks.py: 4 endpoints (deprecated but functional): `create_planning_task`, `get_task_status`, `approve_task`, `reject_task`
      - agents.py: 2 endpoints: `list_agents`, `get_agent`
      - evidence.py: 2 endpoints: `get_evidence_by_id`, `get_all_evidence`
      - snapshot.py: 2 endpoints: `get_snapshot`, `get_snapshot_metadata`
      Files: `e:/onlinewebsites/quiz-platform/services/project-ai/app/api/routes/tasks.py`, `e:/onlinewebsites/quiz-platform/services/project-ai/app/api/routes/agents.py`, `e:/onlinewebsites/quiz-platform/services/project-ai/app/api/routes/evidence.py`, `e:/onlinewebsites/quiz-platform/services/project-ai/app/api/routes/snapshot.py`
      Verify: Grep each file for `from app.auth.dependencies import get_current_user` and `Depends(get_current_user)`. Confirm tasks.py has 4 matches, agents.py has 2, evidence.py has 2, snapshot.py has 2.

- [ ] 8. **Secure main.py root endpoint**
      Import `get_current_user` and `Depends` from fastapi. Add `user: dict = Depends(get_current_user)` to `@app.get("/")` root endpoint.
      Files: `e:/onlinewebsites/quiz-platform/services/project-ai/app/main.py`
      Verify: Read main.py and confirm root endpoint has `user: dict = Depends(get_current_user)` parameter.

- [ ] 9. **Skip health.py and creation.py**
      health.py: /health endpoint remains public for monitoring (no auth required).
      creation.py: all endpoints return 405 METHOD_NOT_ALLOWED (disabled), no auth needed.
      Files: None (verification only)
      Verify: Read health.py and confirm /health endpoint has NO `Depends(get_current_user)`. Read creation.py and confirm all endpoints raise HTTPException 405.

- [ ] 10. **Create test_jwt_verifier.py with comprehensive JWT verification tests**
      Create new test file with 12 tests covering: valid tokens with all claims, missing audience, wrong audience, missing/wrong tokenType, missing userId/originalUserId/shadowUserId, expired tokens, invalid signatures, malformed tokens, token creation with required claims. Use pytest fixtures for JWT_SECRET_KEY. Import decode_access_token, create_access_token from app.auth.jwt.
      Files: `e:/onlinewebsites/quiz-platform/services/project-ai/tests/unit/test_jwt_verifier.py`
      Verify: Run `python -m pytest tests/unit/test_jwt_verifier.py -v` and confirm all 12 tests pass. Read test file and confirm all required test cases present.

- [ ] 11. **Run full unit test suite to verify no regressions**
      Run all existing unit tests to ensure auth changes don't break existing functionality. Focus on auth-related tests.
      Files: All test files
      Verify: Run `python -m pytest tests/unit/test_auth_jwt.py tests/unit/test_auth_dependencies.py tests/unit/test_jwt_verifier.py -v` and confirm all tests pass (existing + new).

- [ ] 12. **Final verification: grep all route files for auth coverage**
      Verify all 35 endpoints (excluding /health) now have authentication. Count `Depends(get_current_user)` occurrences across all route files.
      Files: All route files in `e:/onlinewebsites/quiz-platform/services/project-ai/app/api/routes/`
      Verify: Run grep/ripgrep command to count `Depends(get_current_user)` across all route files. Expected: workflows(6) + contract(2) + candidate(8) + governance(7) + tasks(4) + agents(2) + evidence(2) + snapshot(2) + main.py(1) = 34+ matches (some files may have more endpoints than initially counted).

---

## Summary
This plan adds JWT authentication to all unprotected endpoints by applying the existing `Depends(get_current_user)` pattern. The auth infrastructure (jwt.py, dependencies.py, config.py) is already implemented and tested. The work focuses on systematic application across route files, replacing custom auth in contract.py, and expanding test coverage for JWT verification with required claims (audience=user, tokenType=user, userId, originalUserId, shadowUserId).
