# Wave 1D GitHub Audit Findings - Remediation Tracking

**Audit Date**: 2026-10-10
**Auditor**: User (GitHub direct inspection)
**Branch**: m2-project-ai-canonical-wiring
**Base Commit**: 75ce7a2c

---

## Finding A: Route-Level RBAC Incomplete

**Status**: 🟡 IN PROGRESS (Wave 1D)

**Issue**: FastAPI defines `require_contract_admin`, `require_contract_reviewer`, and `require_contract_viewer` in `dependencies.py`, but route handlers use `Depends(get_current_user)` instead of role-specific dependencies.

**Impact**: Privileged operations authenticate but do not authorize - any authenticated user can perform admin operations.

**Required Fix**:
- Replace `get_current_user` with `require_contract_admin` on 4 privileged routes:
  - `POST /workflows` (workflow creation)
  - `POST /workflows/{workflow_id}/approve-final` (final certification)
  - `POST /approvals/workflows/{id}/approve-placement` (placement approval)
  - `POST /candidates/{candidate_id}/execute` (candidate execution)

**Wave 1D Plan Coverage**: ✅ COVERED in FEAT-002 (steps 2-5)

**Verification**: Role-denied and role-allowed tests for each route

---

## Finding B: Governance Endpoints Trust Caller-Supplied Identities (P0)

**Status**: 🔴 CRITICAL - NOT IN ORIGINAL PLAN

**Issue**: `governance.py` endpoints record:
- `request.submittedBy` (client-supplied)
- `request.decidedBy` (client-supplied)
- `payload.approvedBy` (client-supplied)

These client-controlled values are used for:
- Self-approval prevention logic
- Audit trail records
- Identity tracking in workflow state

**Security Impact**: PRIVILEGE ESCALATION - client can:
- Forge identities to bypass self-approval checks
- Impersonate other users in approval workflows
- Pollute audit trails with false identities

**Required Fix**:
1. Audit all governance.py endpoints for client-supplied identity fields
2. Replace with JWT-derived identities: `user.get("user_id") or user.get("email")`
3. Remove identity fields from Pydantic request schemas
4. Add integration tests proving client-supplied identities are ignored

**Wave 1D Plan Coverage**: ❌ NOT COVERED - Added as FEAT-005 via send_message

**Verification**: 
- `test_governance_ignores_client_supplied_submitter`
- `test_governance_ignores_client_supplied_decider`
- `test_self_approval_rejected_with_jwt_identity`

**Priority**: P0 - Must be fixed before Wave 1D approval

---

## Finding C: Candidate Authorization Tests Skipped

**Status**: 🟡 ACCEPTABLE (Integration Tests)

**Issue**: Candidate authorization integration tests remain skipped in Wave 1C test evidence.

**Impact**: No end-to-end proof that brand enforcement works at HTTP route level.

**Required Fix**:
- Enable at least 2 integration tests:
  - `test_candidate_execute_same_brand_succeeds` (positive test)
  - `test_candidate_execute_cross_brand_denied` (negative test)

**Wave 1D Plan Coverage**: ⚠️ NOT IN RBAC SCOPE - Could be separate wave or P1 item

**Verification**: TestClient-based integration tests with database

**Priority**: P1 - Important but not blocking Wave 1D (unit tests already pass)

---

## Recommended Wave 1D Scope (Revised)

| Priority | Work Item | Status | Tests Required |
|----------|-----------|--------|----------------|
| P0 | Enforce roles on privileged workflow operations | ✅ FEAT-002 | Allowed-role and denied-role tests (4 routes) |
| P0 | Remove client-controlled identities from governance | 🔴 FEAT-005 | JWT identity extraction tests (3 tests) |
| P1 | Add RBAC helper functions | ✅ FEAT-001 | require_role, require_any_role, is_super_admin (5 tests) |
| P1 | Comprehensive RBAC test suite | ✅ FEAT-003 | 15 total tests |
| P1 | Update README with RBAC documentation | ✅ FEAT-004 | Manual review |
| P1 | Enable candidate authorization integration tests | ⚠️ OUT OF SCOPE | Defer to integration wave |

---

## Acceptance Criteria (Updated)

Before Wave 1D approval:
- ✅ All 4 privileged routes enforce `contract_admin` role
- 🔴 All governance endpoints extract identities from JWT (not client)
- ✅ 15 RBAC tests passing (plus 3 governance identity tests = 18 total)
- ✅ No regressions in Wave 1B/1C tests (50 total security tests)
- ✅ Auth coverage ≥94%
- ✅ README documents RBAC model
- ✅ Route-to-role authorization matrix documented

**Total Expected Tests**: 
- Wave 1B: 15 tests
- Wave 1C: 24 tests (includes remediation)
- Wave 1D: 18 tests (15 RBAC + 3 governance identity)
- **Grand Total**: 57 security tests passing

---

## Post-Wave 1D Recommendations

**P1 - Integration Testing Wave**:
- Enable candidate authorization integration tests (TestClient + database)
- Add end-to-end workflow approval tests
- Test full authentication → authorization → execution flow

**P2 - Governance Modernization**:
- Migrate legacy governance endpoints to modern auth patterns
- Remove all remaining client-supplied identity fields
- Add comprehensive governance security tests

**P2 - Database Migration**:
- Create Alembic migration for candidate.brand column
- Document rollback procedure
- Add migration to deployment checklist

---

## Notes

- Finding B (governance identity spoofing) is CRITICAL and not in original Wave 1D plan
- Sent FEAT-005 alert to Wave 1D planner via send_message (session sess_290d626e-5f12-43e1-80ef-5eaf25e6fed6)
- Integration test gaps are acceptable for Wave 1D (unit tests provide coverage)
- All findings align with Zero Trust principles: verify identity at every layer

---

## GitHub Verification Checklist

Before merging m2-project-ai-canonical-wiring:
- [ ] All 57 security tests passing on GitHub Actions
- [ ] Wave 1D documentation present in `.agents/tasks/`
- [ ] No client-supplied identity fields in governance.py request schemas
- [ ] All privileged routes use `require_contract_admin` dependency
- [ ] README documents complete RBAC model
- [ ] No TODO or FIXME comments related to security
- [ ] Migration file exists for candidate.brand column

**Audit Completion**: This document tracks all findings. Wave 1D workflow must address Finding B (FEAT-005) before approval.
