# FND03 Ownership Architecture - Review Report

**Reviewer:** Sol (Independent Review Agent)  
**Review Date:** 2026-01-11  
**Commit:** d7858b37d1fd6edebd95c987b1002a3636b4a170  
**Branch:** remediation/w1-2-batch-05-targeted  
**Status:** CHANGES_REQUESTED

---

## Evidence Verification

### Test Results (from commit message)
- ✅ 18 tests passing (packages/auth/src/rbac/__tests__/ownership.service.test.ts)
- ✅ 7 new tenant boundary enforcement tests added
- ✅ TypeScript compilation verified (pnpm exec tsc --noEmit)
- ✅ Tests recorded in commit message d7858b37

### Schema Changes Verified
- ✅ `packages/db/src/schema/auth.ts`: Added tenantEnum, tenantId, localSubjectId columns with composite index
- ✅ `packages/db-tutorial/src/schema/tutorial-progress.ts`: Added tenantId column with updated unique constraint
- ✅ Migration 0001_fnd03_add_tenant_ownership.sql created
- ✅ Migration 0029_fnd03_add_tenant_to_progress.sql created
- ✅ Default tenant assignment to 'realtutorialhub' documented

### Service Layer Changes Verified
- ✅ OwnershipContext interface updated with requestingTenant, resourceTenant, shadowUserId fields
- ✅ OwnershipRBACService.isOwner() enforces tenant boundary BEFORE userId comparison
- ✅ OwnershipRBACService.hasPermissionOrOwnership() checks tenant first for non-admin users
- ✅ Enforcer requirePermissionOrOwnership() accepts tenant parameters
- ✅ RBAC guard extracts tenant from JWT: `(auth as any).brand || 'realtutorialhub'`
- ✅ withOwnershipRBAC helper requires getResourceTenant parameter

### FND11 Coordination Verified
- ✅ FND03 did NOT modify packages/db-people schema (no file conflicts)
- ✅ db-people coordination claim accurate: "platform column already serves as tenant discriminator"
- ✅ No schema collision with FND11 people email foundation work

---

## Critical Security Findings

### BLOCKER 1: Unsafe Fallback to Default Tenant
**Severity:** CRITICAL  
**Location:** `packages/auth/src/rbac/rbac.guard.ts:178`

```typescript
requestingTenant: (auth as any).brand || 'realtutorialhub',
```

**Issue:**  
When JWT brand claim is missing or undefined, the code falls back to 'realtutorialhub' tenant. This violates the selected ownership policy: **"Unknown provenance denies access."**

**Consequence:**  
A JWT without a brand claim (malformed token, legacy token, or attack) is implicitly granted 'realtutorialhub' tenant access instead of being rejected.

**Evidence:**  
From ownership-classification.md line 68:
> **Unknown Provenance** = Deny access when tenant unverifiable
> **Current:** Code tolerates missing tenant context | ❌ Unsafe fallback behavior

**Required Fix:**  
Replace fallback with explicit rejection when brand is missing:

```typescript
if (!(auth as any).brand) {
  throw new ForbiddenError('JWT brand claim required for tenant-qualified ownership');
}
const requestingTenant = (auth as any).brand;
```

**File:** packages/auth/src/rbac/rbac.guard.ts  
**Lines:** 178, 192

---

### BLOCKER 2: Enforcer Fallback Violates Policy
**Severity:** CRITICAL  
**Location:** `packages/auth/src/rbac/enforcer.ts:46`

```typescript
requestingTenant: user.tenant || 'realtutorialhub',
```

**Issue:**  
Same unsafe fallback pattern in the enforcer function. When downstream code calls `requirePermissionOrOwnership()` without providing tenant, it defaults to 'realtutorialhub' instead of failing.

**Consequence:**  
API routes that forget to pass tenant parameter will silently use wrong tenant context, bypassing multi-tenant isolation.

**Required Fix:**  
Make tenant parameter mandatory and throw when missing:

```typescript
if (!user.tenant) {
  throw new ForbiddenError('Tenant context required for ownership checks');
}
const requestingTenant = user.tenant;
```

**File:** packages/auth/src/rbac/enforcer.ts  
**Line:** 46

---

### BLOCKER 3: Missing Tenant Verification in Enforcer Signature
**Severity:** HIGH  
**Location:** `packages/auth/src/rbac/enforcer.ts:38-50`

**Issue:**  
The enforcer function signature allows `user.tenant` to be optional (`tenant?: string`), but tenant qualification is a REQUIRED part of FND03 ownership policy. Making it optional invites callers to omit it.

**Current Signature:**
```typescript
export function requirePermissionOrOwnership(
  user: { userId: string; roles: Role[]; tenant?: string; shadowUserId?: string },
  resourceOwnerId: string,
  resourceTenant: string,
  permission: Permission
): void
```

**Required Signature:**
```typescript
export function requirePermissionOrOwnership(
  user: { userId: string; roles: Role[]; tenant: string; shadowUserId?: string },
  resourceOwnerId: string,
  resourceTenant: string,
  permission: Permission
): void
```

**File:** packages/auth/src/rbac/enforcer.ts  
**Lines:** 38-42

---

## Correctness Findings

### FINDING 4: Integration Guidance Incomplete
**Severity:** MEDIUM  
**Location:** `.agents/tasks/fnd03-ownership-architecture.md` Section 7.1

**Issue:**  
The integration guidance shows an example pattern for API route developers, but there is NO actual enforcement requiring downstream routes to migrate. The old signature (without tenant parameters) is still callable because tenant is optional.

**Consequence:**  
Existing API routes using the old pattern will continue to work with unsafe fallback instead of failing at compile time or runtime.

**Required Fix:**  
After fixing BLOCKER 3 (making tenant required), verify that TypeScript compilation fails for any route still using the old pattern. Document the breaking change and provide migration checklist.

**File:** .agents/tasks/fnd03-ownership-architecture.md  
**Section:** 7.1

---

### FINDING 5: Missing JWT Brand Claim Validation
**Severity:** MEDIUM  
**Location:** `packages/auth/src/rbac/rbac.guard.ts:177-182`

**Issue:**  
The RBAC guard extracts brand from JWT using type assertion `(auth as any).brand` without first validating that the auth context actually contains a brand claim. If the JWT was decoded but brand is undefined, the fallback silently assigns wrong tenant.

**Required Fix:**  
Add explicit validation before ownership check:

```typescript
const brand = (auth as any).brand;
if (!brand) {
  console.error('🔐 RBAC GUARD: Missing brand claim in JWT', {
    route: req.url,
    userId: auth.userId,
  });
  
  return new Response(
    JSON.stringify({
      code: 'INVALID_TOKEN',
      message: 'JWT brand claim required',
    }),
    { status: 401, headers: { 'Content-Type': 'application/json' } }
  );
}
```

**File:** packages/auth/src/rbac/rbac.guard.ts  
**Lines:** 177-182

---

## Verification Gaps

### GAP 1: Migrations Not Applied to Any Environment
**Severity:** HIGH  
**Status:** DOCUMENTED BUT NOT EXECUTED

From implementation report Section 8.1:
- [x] Migrations generated and reviewed
- [ ] Migration applied to development database
- [ ] Migration dry-run on staging database

**Issue:**  
The schema changes exist only in SQL files. There is no evidence that migrations were executed against development, staging, or test databases. The tests pass because they mock the service layer, not because the actual database schema supports tenant columns.

**Required Evidence:**  
- Migration execution logs showing 0001_fnd03 and 0029_fnd03 applied
- Database introspection output confirming tenantId columns exist
- Query plan analysis for tenant-qualified indexes

**File:** .agents/tasks/fnd03-ownership-architecture.md  
**Section:** 8.1

---

### GAP 2: No Integration Tests with Actual API Routes
**Severity:** MEDIUM  
**Status:** ACKNOWLEDGED IN IMPLEMENTATION REPORT

From Section 8.1:
- [x] Test suite passes (18/18 tests)
- [ ] Integration tests with actual API routes (pending downstream implementation)

**Issue:**  
All 18 tests are isolated unit tests of the ownership service. There are no tests demonstrating that actual API routes (tutorial progress, export download, taxonomy admin) consume the new tenant-aware enforcement.

**Required Evidence:**  
At least one end-to-end test showing:
1. JWT with brand claim "skillup"
2. API route attempting to access "realtutorialhub" resource
3. 403 response with cross-tenant denial message

**File:** packages/auth/src/rbac/__tests__/ownership.service.test.ts  
**Missing:** e2e or integration test file

---

## Acceptance Blockers Summary

**CHANGES_REQUESTED** - 3 critical security blockers must be fixed:

1. **BLOCKER 1:** Remove unsafe tenant fallback in rbac.guard.ts line 178
2. **BLOCKER 2:** Remove unsafe tenant fallback in enforcer.ts line 46
3. **BLOCKER 3:** Make tenant parameter required (not optional) in enforcer signature

**Additional Corrections Required:**
4. Add JWT brand validation before ownership check (rbac.guard.ts)
5. Document breaking change for downstream API routes
6. Provide migration execution evidence or defer to deployment phase

---

## What Was Done Well

1. ✅ **Comprehensive test coverage** for tenant boundary scenarios (7 new tests)
2. ✅ **Clear documentation** of implementation rationale and integration guidance
3. ✅ **Schema design** correctly uses composite indexes for tenant-qualified queries
4. ✅ **Service layer logic** enforces tenant boundary BEFORE userId comparison
5. ✅ **FND11 coordination** verified - no schema file conflicts with db-people
6. ✅ **Migration strategy** documented with default tenant assignment and rollback plan
7. ✅ **Ownership classification** analysis correctly identified 181 callers and gaps

---

## Recommended Next Steps

1. **Address 3 critical blockers** (tenant fallback removal, required tenant parameter)
2. **Re-run TypeScript compilation** to verify breaking change surface
3. **Identify affected callers** that will break after making tenant required
4. **Add brand validation** to RBAC guard before ownership check
5. **Execute migrations** in development environment or document deferral to deployment
6. **Resubmit for review** with corrected implementation

---

## References

- Implementation report: .agents/tasks/fnd03-ownership-architecture.md
- Ownership classification: .agents/tasks/fnd03-ownership-architecture/ownership-classification.md
- Selected policy: audit/Claude_Sonnet45_W1_W3_Completion_Directive.md
- Test file: packages/auth/src/rbac/__tests__/ownership.service.test.ts
- Commit: d7858b37d1fd6edebd95c987b1002a3636b4a170

---

**Review Status:** CHANGES_REQUESTED  
**Blockers:** 3 critical security findings  
**Non-blocking gaps:** 2 verification gaps (migrations, integration tests)
