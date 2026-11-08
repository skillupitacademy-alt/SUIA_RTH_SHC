# Email Uniqueness and Normalization Policy

**Task:** FND11 People Projection and Email Compatibility  
**Policy Type:** Architectural Decision Record  
**Status:** Design Phase  
**Date:** 2026-11-06  
**Worktree:** e:/onlinewebsites/quiz-platform/.worktrees/fnd11-people-email  
**Base SHA:** 30318398

---

## Executive Summary

This policy establishes **tenant-scoped email uniqueness** with canonical normalization for the quiz-platform. Emails must be unique within each platform (tenant) but may be duplicated across different platforms. All email storage and lookups must apply lowercase and trim normalization. Foreign-tenant email collisions in admission flows must be rejected with 403/409 status codes.

---

## Context and Problem Statement

The platform manages three distinct tenants via the `platform` enum in `packages/db-people/src/schema/users.ts`:
- `skillup` - SkillUp IT Academy (training/classroom platform)
- `realtutorialhub` - RealTutorialHub (self-paced learning platform)  
- `skillhubcore` - SkillHubCore (administrative/governance platform)

### Current Defect

The admission route at `apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/route.ts` (line 33) performs an **unscoped email lookup**:

```typescript
const [existingUser] = await db
  .select({ id: users.id })
  .from(users)
  .where(eq(users.email, enquiry.email))
  .limit(1);
```

**Problem:** This query returns a user from ANY platform. When a SkillUp enquiry email matches a RealTutorialHub user, the admission route:
1. Finds the foreign-platform user
2. Creates an admission linking that foreign userId to a SkillUp batch
3. Creates enrollment linking the foreign user to a SkillUp batch
4. Returns HTTP 200 success (INCORRECT - should be 403/409)

**Test Evidence:**  
Test `audit/W1.2_Batch_08_Sol_Probe.py` expects 403/409 for foreign-tenant email collision but receives 200.

Failing test in `apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/__tests__/collision.test.ts`:
```typescript
it('does not admit a foreign-platform email match', async () => {
  const response = await POST(/* ... */);
  expect.soft(response.ok).toBe(false); // Currently fails - returns 200
  expect.soft(f.writes).not.toHaveBeenCalled(); // Should not create records
});
```

### Current Schema Constraint

`packages/db-people/src/schema/users.ts` has a **global unique constraint**:
```typescript
email: text('email').notNull().unique(),
```

This prevents legitimate cross-platform email duplication and creates false conflicts between independent tenants.

---

## Policy Decision: Tenant-Scoped Email Uniqueness

### Statement

**Emails MUST be unique within each platform (tenant) but MAY be duplicated across different platforms.**

### Scope Semantics

| Scenario | Policy | Rationale |
|----------|--------|-----------|
| **Within-platform uniqueness** | No two active (deletedAt IS NULL) users on the SAME platform may share an email | Prevents authentication ambiguity, duplicate accounts |
| **Cross-platform independence** | Users on DIFFERENT platforms MAY share the same email | Allows independent tenant populations, separate business contexts |
| **Deleted user handling** | Deleted users (deletedAt IS NOT NULL) do NOT block email reuse | Enables account recovery, email recycling |
| **Foreign-tenant collision** | Admission/creation attempts with foreign-platform email MUST create new user or reject | Enforces tenant isolation |

### Rationale

**For tenant-scoped uniqueness:**
1. **Tenant isolation:** Each platform represents an independent business context with separate user populations and authorization boundaries
2. **Deployment flexibility:** The same person may legitimately have separate accounts on different platforms (e.g., faculty on SkillUp, learner on RealTutorialHub)
3. **Migration support:** Facilitates future multi-tenant architecture evolution (FND03/FND18)
4. **Security boundaries:** Prevents cross-platform credential reuse and authentication leakage
5. **Business independence:** SkillUp and RealTutorialHub serve overlapping audiences but require separate identities
6. **Current architecture alignment:** The `platform` field is already authoritative for brand isolation in JWT tokens and routing

**Against global uniqueness:**
1. Creates false conflicts between independent tenants
2. Forces premature identity linking before projection architecture exists (FND18 dependency)
3. Breaks admission workflows when legitimate separate identities exist
4. Complicates invitation and signup flows unnecessarily
5. Does not match current authorization model (platform-based JWT claims)

**Against email as cross-platform identity:**
1. Email is not a reliable unique identifier across organizational boundaries
2. Same email may represent different people (role accounts, shared emails, organizational handoffs)
3. Identity projection is an FND18 concern, not FND11
4. No canonical people table or cross-platform identity mapping exists

---

## Email Normalization Policy

### Normalization Rules

All email addresses MUST be normalized **before storage** and **before lookup**:

1. **Lowercase:** `email.toLowerCase()`  
   - Rationale: Email local parts are case-insensitive per RFC 5321
   - Example: `John.Doe@Example.COM` → `john.doe@example.com`

2. **Trim whitespace:** `email.trim()`  
   - Rationale: Removes accidental leading/trailing spaces
   - Example: `  user@example.com  ` → `user@example.com`

3. **No Unicode normalization**  
   - Rationale: Email local parts must be ASCII per RFC 5322
   - Non-ASCII emails should be rejected at validation

### Validation Requirements

Before normalization, validate email format:
- Pattern: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` (basic RFC 5322 compliance)
- Reject: Empty strings, missing `@`, missing domain, excessive length (>254 chars)
- Accept: Standard ASCII characters in local part and domain

### Application Points

Email normalization MUST be applied at:
1. **User creation:** Signup, invitation, admission, admin user creation
2. **Authentication:** Login, password recovery token generation
3. **Lookups:** Admin search, duplicate detection, foreign-tenant checks
4. **Updates:** Email change operations (if supported)
5. **Verification:** Email verification token generation

### Existing Normalization Patterns

Codebase already applies normalization inconsistently:

**Correct examples:**
```typescript
// apps/api-server/src/modules/auth/shc-auth.service.ts:33
const cleanEmail = email.trim().toLowerCase();

// apps/api-server/src/modules/auth/password-recovery.service.ts:22
const cleanEmail = email.toLowerCase().trim();

// apps/api-server/src/modules/auth/admin-auth.service.ts:33
const cleanEmail = email.trim();
```

**Missing normalization:**
```typescript
// apps/skillup-admin/.../admit/route.ts:33 (DEFECT)
where(eq(users.email, enquiry.email)) // No normalization!

// services/skillhubcore-service/.../user.repository.ts:47
where(and(eq(schema.users.email, email), ...)) // No normalization!
```

---

## Foreign-Tenant Email Collision Handling

### Admission Flow Behavior

When admitting an enquiry with email `student@example.com`:

| Existing User Platform | Target Platform | Current Behavior | Required Behavior |
|------------------------|-----------------|------------------|-------------------|
| None | skillup | Create new user | ✅ Create new user |
| skillup | skillup | Reuse userId | ✅ Reuse userId |
| realtutorialhub | skillup | Reuse foreign userId (BUG) | ❌ Create new skillup user OR reject 409 |
| skillup (deleted) | skillup | Create new user | ✅ Allow (partial index excludes deleted) |

**Required fix for foreign-tenant collision:**

**Option A:** Create separate identity (RECOMMENDED)
```typescript
const [existingUser] = await db
  .select({ id: users.id })
  .from(users)
  .where(and(
    eq(users.email, normalizeEmail(enquiry.email)),
    eq(users.platform, 'skillup'), // Scope to target platform
    isNull(users.deletedAt)
  ))
  .limit(1);
// If existingUser is undefined, create new skillup user even if email exists elsewhere
```
- **Pros:** Preserves tenant isolation, allows legitimate cross-platform accounts
- **Cons:** May create duplicate identities for the same person

**Option B:** Reject collision (ALTERNATIVE)
```typescript
// First check: does email exist on ANY platform?
const [anyUser] = await db
  .select({ id: users.id, platform: users.platform })
  .from(users)
  .where(and(
    eq(users.email, normalizeEmail(enquiry.email)),
    isNull(users.deletedAt)
  ))
  .limit(1);

if (anyUser && anyUser.platform !== 'skillup') {
  return jsonError('Email registered on different platform', 409);
}
// Proceed with admission if none or same-platform match
```
- **Pros:** Prevents accidental duplicate identities
- **Cons:** May block legitimate separate accounts, requires manual resolution

**Recommended:** **Option A** - Create separate identity. Rationale:
1. Aligns with tenant-scoped uniqueness policy
2. No manual intervention required
3. Future FND18 identity projection can link accounts if needed
4. Matches current architecture (platform is authoritative tenant boundary)

### Authentication Flow Behavior

Login requests MUST include platform context (from domain/brand header):

```typescript
// services/skillhubcore-service/src/modules/auth/auth.service.ts
async login(input: LoginInput): Promise<AuthResult> {
  // MUST filter by input.platform
  const user = await this.userRepo.findByEmail(input.email); // MISSING PLATFORM FILTER (DEFECT)
  // ...
}
```

**Required fix:**
```typescript
async findByEmail(email: string, platform: PlatformName): Promise<PeopleUserRecord | undefined> {
  const rows = await this.dbClient
    .select()
    .from(schema.users)
    .where(and(
      eq(schema.users.email, normalizeEmail(email)),
      eq(schema.users.platform, platform),
      isNull(schema.users.deletedAt)
    ))
    .limit(1);
  return rows[0];
}
```

### Password Recovery Flow Behavior

Forgot password requests MUST scope to platform:

```typescript
// apps/api-server/src/modules/auth/password-recovery.service.ts
async forgotPassword(email: string, ip?: string, brand: RequestBrand = 'realtutorialhub') {
  const cleanEmail = email.toLowerCase().trim();
  // MUST lookup user on brand's platform only
  const user = await brandUserRepo.findByEmail(cleanEmail); // MISSING PLATFORM FILTER (DEFECT)
  // ...
}
```

### Cross-Platform Email Enumeration Prevention

Admin search and lookup operations MUST:
1. Filter by authenticated user's platform OR explicit platform parameter
2. NOT reveal whether email exists on other platforms
3. Return 404 "not found" instead of "exists elsewhere" to prevent enumeration

---

## Migration Plan

### Phase 1: Pre-Migration Audit (READ-ONLY)

Execute queries to assess current state:

```sql
-- 1. Check for duplicate emails within SAME platform (should be 0)
SELECT email, platform, COUNT(*) as count
FROM users
WHERE deleted_at IS NULL
GROUP BY email, platform
HAVING COUNT(*) > 1;

-- 2. Check for duplicate emails across DIFFERENT platforms (informational)
SELECT email, COUNT(DISTINCT platform) as platform_count,
       array_agg(DISTINCT platform) as platforms
FROM users
WHERE deleted_at IS NULL
GROUP BY email
HAVING COUNT(DISTINCT platform) > 1;

-- 3. Check for users with NULL platform (should be 0)
SELECT COUNT(*) as null_platform_count
FROM users
WHERE platform IS NULL;

-- 4. Verify deleted users don't block active users
SELECT email, platform, deleted_at, COUNT(*) as count
FROM users
GROUP BY email, platform, deleted_at
HAVING COUNT(*) > 1;
```

**Decision gates:**
- If duplicates exist within same platform → Manual resolution required before migration
- If NULL platforms exist → Backfill with default platform before migration
- Document existing cross-platform duplicates (expected, not a blocker)

### Phase 2: Add Composite Unique Index (NON-BREAKING)

```sql
-- Create partial unique index (allows email reuse after deletion)
CREATE UNIQUE INDEX CONCURRENTLY uniq_users_email_platform
ON users (LOWER(TRIM(email)), platform)
WHERE deleted_at IS NULL;
```

**Properties:**
- `CONCURRENTLY`: Builds index without locking table (production-safe)
- `LOWER(TRIM(email))`: Functional index enforces normalization at database level
- `WHERE deleted_at IS NULL`: Partial index allows email reuse after soft deletion

**Impact:**
- Can run on live database
- Does not block reads or writes during creation
- May take several minutes on large tables
- Will FAIL if duplicates exist within same platform (desired - surfaces data issues)

**Verification:**
```sql
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'users' AND indexname = 'uniq_users_email_platform';
```

### Phase 3: Deploy Code Changes (BREAKING for admission route)

**Deployment sequence:**
1. Deploy admission route fix (scoped email lookup)
2. Deploy auth service changes (platform-scoped login/signup)
3. Deploy password recovery changes (platform-scoped token generation)
4. Deploy email normalization wrappers

**Required code changes:** See `design.md` for implementation details.

**Rollout strategy:**
- Feature flag: `ENABLE_TENANT_SCOPED_EMAIL` (default: false)
- Gradual rollout: Enable for SkillUp Admin first, then RealTutorialHub, then SkillHubCore
- Monitor: Cross-platform collision rejections, authentication failures

### Phase 4: Remove Global Unique Constraint (BREAKING)

**ONLY after code deployment and monitoring:**

```sql
-- Find the constraint name (may vary)
SELECT conname
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND contype = 'u'
  AND conkey = (SELECT array_agg(attnum) FROM pg_attribute WHERE attrelid = 'users'::regclass AND attname = 'email');

-- Remove global unique constraint
ALTER TABLE users DROP CONSTRAINT users_email_unique;
-- OR (if constraint name differs):
ALTER TABLE users DROP CONSTRAINT users_email_key;
```

**Impact:**
- **BREAKING:** Must have composite index and code changes deployed first
- **IRREVERSIBLE:** Cannot rollback if cross-platform duplicate emails are created after deployment
- Requires brief downtime or phased deployment with connection draining

**Verification:**
```sql
-- Should return 0 rows
SELECT conname
FROM pg_constraint
WHERE conrelid = 'users'::regclass
  AND conname IN ('users_email_unique', 'users_email_key');

-- Test duplicate insertion (should succeed across platforms, fail within platform)
BEGIN;
INSERT INTO users (email, platform, password_hash, role)
VALUES ('test@example.com', 'skillup', 'hash1', 'student');

INSERT INTO users (email, platform, password_hash, role)
VALUES ('test@example.com', 'realtutorialhub', 'hash2', 'student');
-- Should succeed (different platforms)

INSERT INTO users (email, platform, password_hash, role)
VALUES ('test@example.com', 'skillup', 'hash3', 'student');
-- Should FAIL with unique violation (same platform)
ROLLBACK;
```

### Phase 5: Existing Duplicate Email Resolution

**If pre-migration audit finds duplicates within same platform:**

1. **Identify conflicts:**
```sql
SELECT email, platform, id, created_at, updated_at, role,
       (SELECT COUNT(*) FROM admissions WHERE student_user_id = users.id) as admission_count,
       (SELECT MAX(created_at) FROM sessions WHERE user_id = users.id) as last_login
FROM users
WHERE deleted_at IS NULL
  AND (email, platform) IN (
    SELECT email, platform
    FROM users
    WHERE deleted_at IS NULL
    GROUP BY email, platform
    HAVING COUNT(*) > 1
  )
ORDER BY email, platform, created_at;
```

2. **Resolution strategies:**
   - **Keep most recent login:** Preserve user with latest session, soft-delete others
   - **Keep with most activity:** Preserve user with admissions/enrollments, soft-delete others
   - **Manual review:** For high-value accounts, manually merge data before deletion

3. **Soft-delete duplicates:**
```sql
-- Example: Keep newest user, delete older duplicates
UPDATE users
SET deleted_at = NOW(),
    email = email || '.deleted.' || id::text -- Prevent immediate reuse
WHERE id IN (
  -- Subquery identifying duplicate users to delete
);
```

### Rollback Procedure

**Rollback Phase 4 (remove constraint):** NOT POSSIBLE if cross-platform duplicates exist.

**Rollback Phase 3 (code changes):**
1. Set feature flag `ENABLE_TENANT_SCOPED_EMAIL=false`
2. Revert code deployment
3. Verify admission tests pass
4. Monitor for authentication issues

**Rollback Phase 2 (composite index):**
```sql
DROP INDEX CONCURRENTLY uniq_users_email_platform;
```

**Rollback to global uniqueness:** ONLY if no cross-platform duplicates were created:
```sql
-- Re-add global unique constraint (will fail if duplicates exist)
ALTER TABLE users ADD CONSTRAINT users_email_unique UNIQUE (email);
```

---

## Acceptance Criteria

1. ✅ **Policy document exists** specifying tenant-scoped uniqueness (this document)
2. ✅ **Email normalization rules** defined (lowercase + trim)
3. ✅ **Foreign-tenant collision handling** specified (create new user or reject 409)
4. ✅ **Migration plan exists** with rollback procedures
5. ⏳ **Schema migration** adds composite unique index `(LOWER(TRIM(email)), platform, deletedAt)`
6. ⏳ **Global unique constraint removed** after code deployment
7. ⏳ **Admission route fix** includes platform filter in email lookup
8. ⏳ **Authentication services updated** to include platform in findByEmail
9. ⏳ **Test passes:** `collision.test.ts` expects `response.ok = false`
10. ⏳ **No regression:** Existing same-platform admission tests continue to pass

---

## Out of Scope

**Deferred to FND16 (Forms/Actions):**
- Email verification workflows
- Email change operations
- Invitation system implementation

**Deferred to FND18 (Identity Projection):**
- Canonical people table linking cross-platform identities
- Cross-platform SSO identity mapping
- Account merging tools

**Not in FND11:**
- Email delivery/SMTP configuration changes
- Password policy changes
- Rate limiting on email operations
- Bulk user import with deduplication
- Physical database migration execution (requires explicit authorization)

---

## Coordination with Other Tasks

### FND03 (Tenant Columns)
- **Overlap:** Both modify `packages/db-people/src/schema/users.ts`
- **Sequence:** FND11 merges email index first, FND03 rebases and adds `tenantId` column
- **Future:** Composite index becomes `(email, tenantId)` when `platform` enum is deprecated

### FND16 (Forms/Actions Persistence)
- **Dependency:** FND16 password recovery forms depend on FND11 email scoping policy
- **Contract:** FND11 establishes lookup semantics, FND16 implements form UI/validation

### FND18 (Identity Projection)
- **Dependency:** FND18 canonical people table depends on FND11 tenant-scoped email foundation
- **Contract:** FND11 enforces platform-scoped uniqueness, FND18 builds cross-platform linking

---

## References

- **Defect:** `apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/route.ts:33`
- **Test:** `apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/__tests__/collision.test.ts`
- **Schema:** `packages/db-people/src/schema/users.ts`
- **Auth Service:** `services/skillhubcore-service/src/modules/auth/auth.service.ts`
- **User Repository:** `services/skillhubcore-service/src/modules/user/user.repository.ts`
- **Sol Decision:** `audit/W1.1_Sol_Review_60bd89bb.md` (tenant-scoped email recommendation)
- **Task Status:** `audit/FND01_FND30_Current_Status_Ledger_4c206898.md` FND11 VERIFICATION_FAILED

---

## Approval and Implementation Authority

**Policy Status:** DESIGN PHASE  
**Implementation Scope:** FND11 task boundaries  
**Schema Changes:** Require explicit Sol approval and migration review before physical execution  
**Breaking Changes:** Code deployment MUST precede global constraint removal  
**Sol Review:** Required after implementation before VERIFIED status

---

**Policy Decision:** Tenant-scoped (platform-qualified) email uniqueness with lowercase+trim normalization is the selected approach for FND11 implementation.
