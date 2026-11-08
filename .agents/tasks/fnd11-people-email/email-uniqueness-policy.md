# Email Uniqueness Policy

**Task:** FND11 People Projection and Email Compatibility  
**Policy Type:** Architectural Decision Record  
**Status:** Approved for Implementation  
**Date:** 2026-11-06  
**Decision Authority:** Sol (principal architect)  
**Implementation Owner:** FND11 workflow

---

## Context

The platform manages three distinct tenants via the `platform` enum:
- `skillup` - SkillUp IT Academy training platform
- `realtutorialhub` - RealTutorialHub learning platform  
- `skillhubcore` - SkillHubCore administrative/governance platform

The current `users` table has a global `.unique()` constraint on the `email` column, meaning no two users can share an email address regardless of platform. However, the admission route queries users by email WITHOUT filtering by platform, causing foreign-platform users to be reused when admitting enquiries (VERIFICATION_FAILED).

## Problem Statement

**Current Defect:** The admission route in `apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/route.ts` performs:

```typescript
const [existingUser] = await db
  .select({ id: users.id })
  .from(users)
  .where(eq(users.email, enquiry.email))
  .limit(1);
```

This query returns a user from ANY platform. If a user with email `student@example.com` exists on `realtutorialhub` platform, and an enquiry for the same email is admitted on `skillup` platform, the admission route will:
1. Find the `realtutorialhub` user
2. Create an admission record linking that foreign userId to a skillup batch
3. Create enrollment linking the foreign user to a skillup batch
4. Return HTTP 200 success

**Expected behavior:** The admission should either:
- Reject the foreign-platform collision (403/409 error), OR
- Create a NEW separate user for the skillup platform

**Test evidence:** `audit/W1.2_Batch_08_Sol_Probe.py` contains test `SOL-B08-F foreign brand colliding ID` which expects 403 but receives 200.

## Decision

### Policy: Tenant-Scoped Email Uniqueness

**Statement:** Emails MUST be unique within each platform (tenant) but MAY be duplicated across different platforms.

**Scope semantics:**
- **Within-platform uniqueness:** No two active (deletedAt IS NULL) users on the SAME platform may share an email address
- **Cross-platform independence:** Users on DIFFERENT platforms MAY share email addresses
- **Deleted user handling:** Deleted users (deletedAt IS NOT NULL) do NOT block email reuse on the same platform

### Rationale

**For tenant-scoped uniqueness:**
1. **Tenant isolation:** Each platform represents an independent tenant with separate user populations, authentication boundaries, and business contexts
2. **Deployment flexibility:** Allows the same person to have separate accounts on different platforms (e.g., instructor on skillup, learner on realtutorialhub)
3. **Migration support:** Facilitates future multi-tenant architecture where platforms become first-class tenant entities
4. **Security boundaries:** Prevents cross-platform credential reuse and authentication leakage
5. **Business independence:** SkillUp and RealTutorialHub may serve overlapping user bases but require separate identities
6. **Data sovereignty:** Each platform owns its user records independently

**Against global uniqueness:**
1. Global uniqueness creates false conflicts between independent tenants
2. Forces artificial identity linking before projection architecture exists (FND18)
3. Breaks admission workflows when legitimate separate identities exist
4. Complicates invitation and user creation flows
5. Does not match current authorization model (platform field is authoritative for brand isolation)

**Against email as cross-platform identity:**
1. Email is not a reliable unique identifier across organizational boundaries
2. Same email may legitimately represent different people (shared accounts, role-based emails)
3. Projection and canonical identity are FND18 concerns, not FND11
4. Current architecture has no cross-platform identity table or mapping

## Implementation Requirements

### 1. Schema Changes

**Remove global unique constraint:**
```typescript
// CURRENT (incorrect):
email: text('email').notNull().unique(),

// CORRECTED:
email: text('email').notNull(),
```

**Add composite unique index:**
```typescript
(table) => ({
  // ... existing indexes
  uniqEmailPlatform: uniqueIndex('uniq_users_email_platform')
    .on(table.email, table.platform)
    .where(sql`${table.deletedAt} IS NULL`),
})
```

**Index rationale:**
- Enforces uniqueness within (email, platform) pairs
- Partial index excludes deleted users (allows email reuse after deletion)
- Maintains query performance for email lookups with platform filter

### 2. Query Pattern Requirements

**All email lookups MUST include platform filter:**

```typescript
// ✅ CORRECT: Platform-scoped lookup
const [user] = await db
  .select()
  .from(users)
  .where(and(
    eq(users.email, normalizedEmail),
    eq(users.platform, targetPlatform),
    isNull(users.deletedAt)
  ))
  .limit(1);

// ❌ INCORRECT: Global lookup (forbidden)
const [user] = await db
  .select()
  .from(users)
  .where(eq(users.email, email))
  .limit(1);
```

**Required for:**
- User creation (signup, invitation, admission)
- Authentication (login, token refresh)
- Password recovery
- Email verification
- Admin user search
- Duplicate detection

**Platform determination:**
- Auth routes: derive from request domain/brand header
- Admin routes: explicit platform parameter or authenticated context
- Background jobs: store platform with job metadata

### 3. Email Normalization

**Applied transformations:**
1. **Lowercase:** `email.toLowerCase()` (emails are case-insensitive per RFC 5321)
2. **Trim:** `email.trim()` (remove accidental whitespace)
3. **No Unicode normalization:** Email local parts are ASCII per RFC 5322

**Application point:** Before ANY database operation (insert, update, query)

**Validation:** Basic RFC 5322 regex (e.g., `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`)

### 4. Collision Behavior

**Scenario A: Same email, same platform**
- Action: User creation (signup, admission, invitation)
- Behavior: REJECT with 409 Conflict
- Message: "Email already registered on this platform"

**Scenario B: Same email, different platform**
- Action: User creation on platform B when user exists on platform A
- Behavior: ALLOW - create new independent user
- Result: Two separate user records with same email, different platforms

**Scenario C: Foreign-platform admission**
- Action: SkillUp admission with email existing on RealTutorialHub
- Current behavior: Reuses foreign userId (DEFECT)
- Corrected behavior: Creates new SkillUp user with same email
- Result: Separate identity for SkillUp platform

**Scenario D: Deleted user email**
- Action: Create user with email of deleted user on same platform
- Behavior: ALLOW (partial unique index excludes deleted)
- Result: New user with same email (old user remains deleted)

**Scenario E: Email enumeration**
- Action: Check if email exists on platform A while authenticated on platform B
- Behavior: DENY or return only platform B result
- Security: No cross-platform email enumeration

## Migration Plan

### Phase 1: Pre-Migration Audit (READ-ONLY)
```sql
-- Check for duplicate emails within same platform
SELECT email, platform, COUNT(*) as count
FROM users
WHERE deleted_at IS NULL
GROUP BY email, platform
HAVING COUNT(*) > 1;

-- Check for duplicate emails across different platforms (expected/allowed)
SELECT email, COUNT(DISTINCT platform) as platform_count
FROM users
WHERE deleted_at IS NULL
GROUP BY email
HAVING COUNT(DISTINCT platform) > 1;

-- Check for invalid platform values
SELECT DISTINCT platform FROM users WHERE platform IS NULL;
```

### Phase 2: Add Composite Index (NON-BREAKING)
```sql
CREATE UNIQUE INDEX CONCURRENTLY uniq_users_email_platform
ON users (email, platform)
WHERE deleted_at IS NULL;
```

**Impact:** 
- Can run on live database with CONCURRENTLY
- Does not block reads or writes
- May fail if duplicates exist within same platform (desired - surfaces data issues)

### Phase 3: Resolve Conflicts (MANUAL)
If Phase 2 fails:
1. Identify duplicate emails within same platform
2. Determine authoritative user (most recent login, most activity)
3. Reassign foreign keys or soft-delete duplicates
4. Retry Phase 2

### Phase 4: Remove Global Unique Constraint (BREAKING)
```sql
ALTER TABLE users DROP CONSTRAINT users_email_key;
```

**Impact:**
- Requires brief downtime or phased deployment
- Must deploy code changes BEFORE removing constraint
- Code must already use platform-scoped queries

### Phase 5: Verification
```sql
-- Verify composite index exists
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'users' AND indexname = 'uniq_users_email_platform';

-- Verify global constraint removed
SELECT conname 
FROM pg_constraint 
WHERE conrelid = 'users'::regclass AND conname = 'users_email_key';
-- (should return 0 rows)

-- Attempt to insert duplicate within same platform (should fail)
INSERT INTO users (email, platform, password_hash, role)
VALUES ('test@example.com', 'skillup', 'hash', 'student');
-- (second insert should fail with unique violation)

-- Attempt to insert duplicate across different platforms (should succeed)
INSERT INTO users (email, platform, password_hash, role)
VALUES ('test@example.com', 'realtutorialhub', 'hash', 'student');
-- (should succeed)
```

### Rollback Procedure
```sql
-- 1. Re-add global unique constraint (only if no cross-platform duplicates)
ALTER TABLE users ADD CONSTRAINT users_email_key UNIQUE (email);

-- 2. Remove composite index
DROP INDEX CONCURRENTLY uniq_users_email_platform;

-- 3. Revert code changes
-- 4. Verify existing tests pass
```

**Rollback risk:** Cannot rollback if cross-platform duplicate emails have been created after deployment.

## Testing Requirements

### Unit Tests
1. Email normalization (lowercase, trim, validation)
2. Platform-scoped user creation
3. Cross-platform duplicate detection (should allow)
4. Within-platform duplicate detection (should reject)
5. Deleted user email reuse (should allow)

### Integration Tests
1. Admission with foreign-platform email (should create new user)
2. Signup with existing email on different platform (should allow)
3. Login with email and platform (should find correct user)
4. Password recovery with email (should only recover on target platform)
5. Admin user search by email (should filter by platform)

### Regression Tests
1. Existing admission flow (same-platform email reuse) should work
2. Authentication flows should not break
3. Password recovery should work
4. No performance degradation on email queries

### Security Tests
1. Foreign-platform authentication attempt (should fail)
2. Cross-platform email enumeration (should not reveal)
3. Case variation bypass attempt (should normalize)
4. SQL injection in email field (should sanitize)

### Sol Probe
`audit/W1.2_Batch_08_Sol_Probe.py` test `SOL-B08-F foreign brand colliding ID` must pass:
- Expected: 403 Forbidden or 409 Conflict
- Current: 200 OK (DEFECT)
- After fix: 403/409 (admission creates new user or rejects appropriately)

## Compatibility Considerations

### FND03 Coordination
FND03 adds `tenantId` column to users table. Sequence migrations:
1. FND11 first: email uniqueness with platform
2. FND03 later: add tenantId column
3. Future: migrate platform enum to tenantId foreign key

Both can work on separate branches as long as:
- FND11 merges schema changes first
- FND03 rebases and adds tenantId without conflicting with email index
- Integration test runs both migrations sequentially

### FND16 Dependencies
FND16 (Forms/Actions) depends on email uniqueness policy for:
- Password recovery forms (must look up user on correct platform)
- Newsletter subscription (may allow cross-platform subscriptions)
- Contact forms (email capture without user creation)

FND11 provides the foundation; FND16 implements form contracts.

### FND18 Dependencies
FND18 (Identity Projection) will create canonical people table linking platform-specific users. Email uniqueness policy does NOT block projection:
- Platform-scoped users remain primary identity
- Projection table maps platform users to canonical person
- Email matching aids projection but is not sufficient (requires verified linkage)

## Future Considerations

### Multi-Tenant Architecture
If platform enum evolves into proper tenant entities:
1. Replace `platform` enum with `tenantId` foreign key
2. Unique index becomes `(email, tenantId)`
3. All queries replace `platform = 'skillup'` with `tenantId = ?`
4. Backward compatibility maintained via migration

### Cross-Platform SSO
If future SSO links identities across platforms:
1. Create `identity_links` table mapping platform users to SSO identity
2. Email uniqueness remains platform-scoped
3. SSO authentication looks up user via identity link, not email
4. Email remains non-authoritative for cross-platform identity

### Email Verification
When email verification is added:
1. Store verification state in `user_profiles` or separate table
2. Unverified users may still enforce uniqueness (prevents squatting)
3. Verification required before authentication/authorization
4. Platform-scoped verification (verify separately on each platform)

### Invitation System
When invitations are implemented:
1. Check email uniqueness on target platform before sending
2. If email exists: offer to resend password reset instead
3. If email exists on different platform: proceed with invitation (separate identity)
4. Store invitation with target platform to prevent cross-platform confusion

## References

- **Source defect:** `apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/route.ts` line 36-38
- **Test evidence:** `audit/W1.2_Batch_08_Sol_Probe.py` SOL-B08-F
- **Schema:** `packages/db-people/src/schema/users.ts`
- **Authority:** `audit/Claude_Sonnet45_W1_W3_Completion_Directive.md` FND11 section
- **Handoff status:** `audit/W1_W3_Terra_Consolidated_Handoff.md` FND11 VERIFICATION_FAILED

## Approval and Implementation Authority

**Policy status:** APPROVED for implementation  
**Implementation scope:** FND11 task boundaries  
**Schema changes:** Require explicit migration review before physical execution  
**Breaking changes:** Code deployment must precede constraint removal  
**Sol review:** Required after implementation before VERIFIED status

---

**Policy Decision:** Tenant-scoped (platform-qualified) email uniqueness is the selected and approved approach for FND11 implementation.
