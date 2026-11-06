# FND11 People Projection and Email Compatibility Requirements

**Task ID:** FND11  
**Phase:** Foundation Phase 1 (W1-W3)  
**Group:** G2 (Email Chain)  
**Status:** Implementation  
**Date:** 2026-11-06  
**Baseline:** remediation/w1-2-batch-05-targeted at 30318398  
**Worktree:** e:\onlinewebsites\quiz-platform\.worktrees\fnd11-people-email

---

## Summary

FND11 establishes email uniqueness and people projection contracts across the platform. Currently, the admission route accepts foreign-platform users with equal emails, violating tenant isolation (VERIFICATION_FAILED in audit/W1.2_Batch_08_Sol_Probe.py). This task defines and implements the email uniqueness policy, inventories all email lookup consumers, establishes normalization rules, and fixes the admission route to enforce proper email scoping.

---

## Functional Requirements

### FR1: Email Uniqueness Policy Decision
**Policy Selected:** Tenant-scoped (platform-qualified) email uniqueness

**Rationale:** The current architecture uses `platform` enum ('skillup', 'realtutorialhub', 'skillhubcore') to distinguish tenant boundaries. Emails must be unique within each platform but MAY be duplicated across platforms to support:
- Independent tenant deployments with separate user populations
- Same person with different accounts on different platforms
- Isolation of authentication and authorization boundaries
- Prevention of cross-platform credential reuse attacks

**Implementation:**
- Email lookups MUST filter by `platform` field
- Database constraint: composite unique index on (email, platform, deletedAt)
- Current global `.unique()` on email field MUST be removed
- Admission, auth, recovery, and search routes MUST include platform in email queries

### FR2: Email Normalization
**Rules:**
- Lowercase: Convert all emails to lowercase before storage and comparison
- Trim: Remove leading/trailing whitespace
- No Unicode normalization: Email local parts are case-insensitive per RFC 5321 but domains are ASCII
- Validation: RFC 5322 compliant format (basic regex acceptable)

**Application Points:**
- User creation (signup, invitation, admin creation)
- Login/authentication
- Password recovery
- Admission from enquiry
- Search/lookup operations

### FR3: Consumer Inventory
**Required consumers to audit and fix:**
1. **Admission route** (apps/skillup-admin/.../enquiries/[id]/admit/route.ts) - PRIMARY DEFECT
2. **Authentication** (src/share-branding/auth/authLoader.tsx - signupUser, loginUser)
3. **Password recovery** (apps/*/src/app/forgot-password/page.tsx routes)
4. **User search/admin** (any admin interfaces that look up users by email)
5. **Invitation flows** (if present)
6. **Email verification** (if present)
7. **Profile updates** (if email change is supported)

For each consumer, document:
- File path and function name
- Current email lookup implementation
- Whether platform filter is present
- Expected behavior for duplicate emails across platforms
- Expected behavior for missing users

### FR4: Admission Route Fix
**Current defect:** Line 36-38 in admit/route.ts queries users by email without platform filter

**Required fix:**
```typescript
const [existingUser] = await db
  .select({ id: users.id })
  .from(users)
  .where(and(
    eq(users.email, enquiry.email),
    eq(users.platform, 'skillup'), // Must match target platform
    isNull(users.deletedAt)
  ))
  .limit(1);
```

**Behavior:**
- If user exists on target platform: reuse userId
- If user does NOT exist on target platform: create new user
- If email exists on DIFFERENT platform: create new user (separate identity)
- Return 409 or appropriate error if business logic prohibits duplicate cross-platform emails

### FR5: Invitation vs Duplicate Handling
**Policy:**
- **Invitation:** When explicitly inviting a user, check if email exists on target platform and return appropriate message
- **Admission:** May create duplicate cross-platform account if policy allows
- **Signup:** Check uniqueness within platform, reject if exists on SAME platform
- **Recovery:** Only lookup within target platform

**Edge cases:**
- User with same email on platform A tries to join platform B: ALLOW (separate account)
- User tries to create second account on same platform: DENY (409 Conflict)
- Deleted user (deletedAt NOT NULL) with same email: ALLOW reuse or create new based on business rule

---

## Non-Functional Requirements

### NFR1: Data Integrity
- All email lookups must be atomic with platform filter
- No query may return users from foreign platforms
- Schema migration must preserve existing user data
- No data loss during constraint modification

### NFR2: Performance
- Email lookups remain indexed (composite index on email, platform)
- No full table scans for email queries
- Query performance should not degrade from current baseline

### NFR3: Backward Compatibility
- Existing users with emails must remain accessible
- No breaking changes to authentication contracts (until FND16/FND18)
- Migration must handle existing duplicate emails if any exist

### NFR4: Security
- Foreign-platform email collision must be denied (403 or 409)
- No enumeration of emails across platforms
- Email normalization prevents case-based bypass

---

## Acceptance Criteria

**AC1:** Email uniqueness policy document exists and specifies tenant-scoped uniqueness  
**AC2:** Consumer inventory document lists all email lookup paths with current implementation details  
**AC3:** Schema migration adds composite unique index on (email, platform, deletedAt) and removes global unique constraint  
**AC4:** Admission route queries users with platform filter  
**AC5:** Foreign-tenant email collision test in audit/W1.2_Batch_08_Sol_Probe.py passes (returns 403/409, not 200)  
**AC6:** Existing admission tests continue to pass (no regression)  
**AC7:** Email normalization (lowercase, trim) applied at all identified entry points  
**AC8:** Migration plan document exists with rollback procedure  
**AC9:** No emails duplicated within same platform after migration  
**AC10:** Test coverage includes:
- Same email, different platforms (should allow)
- Same email, same platform (should reject)
- Foreign-platform collision on admission (should reject/create new)
- Email with different casing (should normalize)
- Deleted user email reuse (specified behavior)

---

## Out of Scope

**Deferred to FND16/FND18:**
- Identity projection and canonical people table
- Cross-platform identity linking
- Migration of existing duplicate emails
- Complete authentication contract overhaul
- JWT token changes
- Session management changes

**Not in FND11:**
- Email delivery/SMTP configuration
- Email verification workflows
- Email change workflows
- Bulk import with email deduplication
- Admin tools for merging duplicate accounts
- Password policy changes
- Rate limiting on email lookups
- Physical database migration execution (requires explicit authorization)

---

## Assumptions

1. **Platform field is authoritative:** The `platform` enum accurately represents tenant boundaries
2. **No existing duplicates:** Current database has no email duplicates within same platform (to be verified)
3. **No in-flight migrations:** FND03 tenant columns are not yet applied to users table
4. **Auth contract stability:** Current signupUser/loginUser contracts can be preserved until FND16
5. **Test environment isolation:** W1.2_Batch_08_Sol_Probe.py uses mocked/isolated database

---

## Dependencies

**Blocks:**
- FND16 (Forms/Actions persistence contracts) - depends on email uniqueness policy
- FND18 (Identity projection/people migration) - depends on email scoping foundation

**Blocked by:**
- None (FND11 can proceed independently)

**Coordinates with:**
- FND03 (tenant columns) - both touch users.ts schema, must sequence migrations
- FND06 (admin authorization) - email-based lookups must respect tenant boundaries

---

## Migration Considerations

**Pre-migration verification:**
1. Query existing database for email duplicates within same platform
2. Query for email duplicates across different platforms
3. Identify any deleted users (deletedAt NOT NULL) with duplicate emails
4. Verify all active users have valid platform values

**Migration strategy:**
1. Add composite index on (email, platform, deletedAt) WITHOUT unique constraint
2. Verify index creation performance
3. Audit any existing duplicate emails within same platform
4. Resolve conflicts (manual decision or quarantine)
5. Add UNIQUE constraint to composite index
6. Remove global unique constraint on email column
7. Verify all application queries include platform filter
8. Deploy code changes
9. Monitor for foreign-platform collision rejections

**Rollback:**
1. Remove composite unique index
2. Re-add global unique constraint on email (only if no duplicates exist)
3. Revert code changes
4. Verify existing tests pass

---

## Risk Assessment

**HIGH RISK:**
- Schema migration on users table (high-traffic, authentication dependency)
- Breaking existing duplicate emails if any exist
- Inadvertent cross-platform query exposure

**MEDIUM RISK:**
- Performance degradation if composite index not properly optimized
- Missing email lookup consumer during inventory

**LOW RISK:**
- Email normalization breaking legitimate mixed-case emails (emails are case-insensitive per spec)

---

## Success Metrics

1. Foreign-tenant admission test passes (audit/W1.2_Batch_08_Sol_Probe.py)
2. Zero foreign-platform user lookups in production logs
3. All existing admission tests pass
4. No authentication failures after deployment
5. Email query performance remains within 5% of baseline

---

## References

- audit/W1_W3_Terra_Consolidated_Handoff.md - FND11 status VERIFICATION_FAILED
- audit/Claude_Sonnet45_W1_W3_Completion_Directive.md - FND11 requirements
- audit/W1.2_Batch_08_Sol_Probe.py - Foreign-tenant admission test
- packages/db-people/src/schema/users.ts - Current schema
- apps/skillup-admin/src/app/api/admin/crm/enquiries/[id]/admit/route.ts - Defect location
