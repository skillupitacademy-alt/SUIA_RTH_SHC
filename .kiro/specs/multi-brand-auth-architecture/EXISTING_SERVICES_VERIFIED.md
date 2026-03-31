# Existing Services Verification Report

## Overview

This document verifies which services from the gap analysis already exist in the codebase and what modifications are needed for multi-brand architecture.

**Date**: March 30, 2026  
**Status**: ✅ 7 out of 15 gaps already implemented

---

## ✅ Services That Already Exist

### 1. Email Service ✅

**Location**: `apps/api-server/src/modules/email/EmailService.ts`

**What Exists**:
- EmailService class with Resend provider
- `sendPasswordResetEmail(email, resetUrl)` method
- `sendEmail(options)` generic method
- ResendEmailProvider implementation

**What's Needed**:
- Add brand-specific email templates
- Add methods: `sendWelcomeEmail()`, `sendEmailVerification()`, `sendAdmissionConfirmation()`, `sendPaymentReceipt()`, `sendBatchEnrollmentEmail()`
- RTH vs SkillUp branding

**Files**:
- `apps/api-server/src/modules/email/EmailService.ts`
- `apps/api-server/src/modules/email/providers/ResendEmailProvider.ts`

---

### 2. Email Verification Flow ✅

**Location**: `apps/api-server/src/modules/auth/signup.service.ts`

**What Exists**:
- `verification_tokens` table with token, userId, expiresAt
- `users.email_verified` column
- `verifyEmail(token, ip)` method
- `resendVerification(userId, ip)` method
- Token generation with 24-hour expiry
- Token cleanup after verification

**What's Needed**:
- Add brand parameter to methods
- Brand-specific verification email templates
- Brand-specific redirect URLs after verification

**Files**:
- `apps/api-server/src/modules/auth/signup.service.ts`
- `packages/db/src/schema/auth.ts` (verification_tokens table)

---

### 3. Password Reset Flow ✅

**Location**: `apps/api-server/src/modules/auth/password-recovery.service.ts`

**What Exists**:
- `password_reset_tokens` table with token, userId, expiresAt
- `forgotPassword(email, ip)` method
- `resetPassword(token, newPassword, ip)` method
- `validateResetToken(token)` method
- Token generation with 60-minute expiry
- Email sending with reset URL
- Role-based URL determination (admin vs web)
- Token cleanup after reset

**What's Needed**:
- Add brand parameter to methods
- Brand-specific reset URLs (RTH vs SkillUp)
- Brand-specific email templates

**Files**:
- `apps/api-server/src/modules/auth/password-recovery.service.ts`
- `packages/db/src/schema/auth.ts` (password_reset_tokens table)

---

### 4. RBAC Middleware ✅

**Location**: `services/skillhubcore-service/src/middleware/verify-jwt.ts`

**What Exists**:
- `requireAuth` middleware - validates JWT and extracts user
- `requireRoles(allowedRoles)` middleware - enforces role-based access
- Role checking logic
- 403 Forbidden responses for unauthorized access

**What's Needed**:
- Add brand isolation (check user.brand matches route brand)
- Prevent cross-brand admin access
- Brand-specific role hierarchies

**Files**:
- `services/skillhubcore-service/src/middleware/verify-jwt.ts`

---

### 5. Account Lockout / Brute Force Protection ✅

**Location**: `apps/api-server/src/modules/auth/security.service.ts`

**What Exists**:
- `login_attempts` table with userId, ip, attempts, lockedUntil
- `trackLoginAttempt(ip, email, success)` method
- `isAccountLocked(email, ip)` method
- Progressive lockout strategy:
  - 5 attempts = 15 minutes
  - 10 attempts = 1 hour
  - 20 attempts = 24 hours
- Auto-unlock after expiry
- Attempt tracking per user+IP

**What's Needed**:
- Add brand parameter to methods
- Brand-specific lockout tracking
- Brand-specific lockout notification emails
- Admin unlock capability per brand

**Files**:
- `apps/api-server/src/modules/auth/security.service.ts`
- `packages/db/src/schema/auth.ts` (login_attempts table)

---

### 6. Session Management ✅

**Location**: `services/skillhubcore-service/src/modules/user/user.repository.ts`

**What Exists**:
- `sessions` table with userId, ip, device, expiresAt
- `refresh_tokens` table with userId, token, expiresAt, revoked, lastActiveAt
- `createSession(data)` method
- `revokeSession(userId, sessionId, reason)` method
- `revokeAllSessions(userId, reason)` method
- `revokeSessionByFamily(userId, familyId, reason)` method
- JWT token rotation
- Refresh token family tracking

**What's Needed**:
- Add brand-specific session tracking
- Add endpoints:
  - `GET /auth/sessions` - List all active sessions for current brand
  - `DELETE /auth/sessions/:id` - Logout specific session
  - `DELETE /auth/sessions` - Logout all sessions for current brand
- Cross-brand session isolation

**Files**:
- `services/skillhubcore-service/src/modules/user/user.repository.ts`
- `services/skillhubcore-service/src/modules/auth/auth.routes.ts`

---

### 7. Health Checks and Monitoring ✅

**Location**: `apps/api-server/src/modules/core/health.service.ts`

**What Exists**:
- `HealthService` class
- `getLivenessReport()` - Simple process alive check
- `getReadinessReport()` - Comprehensive dependency checks
- Database connectivity checks with latency tracking
- Cache connectivity checks with usage metrics
- Health status: healthy | unhealthy | degraded
- Metrics recording with `recordTimer()`
- Endpoints: `/api/health/live`, `/api/health/ready`, `/api/status`

**What's Needed**:
- Add Identity Bridge health checks
- Add brand-specific service health checks
- Add auth service health checks (RTH, SkillUp)
- Add cross-service connectivity checks
- Metrics dashboard for multi-brand architecture

**Files**:
- `apps/api-server/src/modules/core/health.service.ts`
- `apps/api-server/src/app/api/health/live/route.ts`
- `apps/api-server/src/app/api/health/ready/route.ts`

---

## 🔴 Services That Need to be Built

### 8. Data Migration Scripts

**Status**: ❌ Does not exist

**What's Needed**:
- Migrate existing users from `quiz_platform_prod` to `rth_prod` or `skillup_prod`
- Determine brand based on user's platform, batch enrollment, admission type
- Sync all users to `people_prod` via Identity Bridge
- Preserve user data (quiz results, tutorial progress, etc.)
- Handle duplicate emails across brands
- Validation queries
- Rollback scripts

**Priority**: 🔴 Critical - Must have before launch

---

### 9. Brand Detection Logic

**Status**: ❌ Does not exist

**What's Needed**:
- Detect brand from JWT token (add brand claim)
- Detect brand from host header (user.realtutorialhub.com vs user.skillupitacademy.com)
- Detect brand from x-brand header (for cross-domain calls)
- Handle edge case: User with same email on both brands (different users)

**Priority**: 🔴 Critical - Must have before launch

---

### 10. Identity Bridge Implementation

**Status**: ❌ Does not exist

**What's Needed**:
- Sync brand users to shadow users in `people_prod`
- Create shadow user on brand user registration
- Link brand userId to shadowUserId
- Handle shadow user updates
- Ensure referential integrity

**Priority**: 🔴 Critical - Must have before launch

---

### 11. API Documentation

**Status**: ⚠️ Partial - No OpenAPI/Swagger docs

**What's Needed**:
- OpenAPI/Swagger docs for all auth endpoints
- API versioning strategy (/v1/auth/login)
- Deprecation policy
- Interactive API documentation

**Priority**: 🟡 Important - Should have soon

---

### 12. Security Testing

**Status**: ❌ Does not exist

**What's Needed**:
- OWASP ZAP automated security scanning
- SQL injection testing
- XSS testing
- CSRF testing
- JWT tampering attempts
- Rate limit bypass attempts
- Session fixation attacks

**Priority**: 🟡 Important - Should have soon

---

### 13. Audit Trail Enhancements

**Status**: ⚠️ Partial - Basic audit logs exist

**What Exists**:
- `audit_logs` table with userId, action, ip, device, metadata
- Logs for login, logout, register

**What's Needed**:
- Log password changes
- Log email changes
- Log role changes
- Log 2FA enable/disable
- Log session revocations
- Admin action audit trail
- Add changedBy, oldValue, newValue columns

**Priority**: 🟡 Important - Should have soon

---

### 14. Two-Factor Authentication (2FA)

**Status**: ❌ Does not exist

**What's Needed**:
- 2FA enrollment
- TOTP generation/verification
- Backup codes
- 2FA enforcement for admin accounts
- Add columns: two_factor_enabled, two_factor_secret, backup_codes

**Priority**: 🟢 Nice to have - Future enhancement

---

### 15. OAuth/Social Login

**Status**: ❌ Does not exist

**What's Needed**:
- Google OAuth
- GitHub OAuth
- LinkedIn OAuth (for placement)
- Add columns: oauth_provider, oauth_id

**Priority**: 🟢 Nice to have - Future enhancement

---

### 16. GDPR Compliance

**Status**: ⚠️ Partial - Soft deletes exist

**What Exists**:
- Soft deletes implemented (deletedAt column)

**What's Needed**:
- User data export (GDPR right to access)
- User data deletion (GDPR right to be forgotten)
- Data retention policies
- Cookie consent management
- Endpoints: `GET /auth/export-data`, `DELETE /auth/delete-account`

**Priority**: 🟢 Nice to have - Future enhancement

---

## 📊 Summary Statistics

### Implementation Status

- ✅ **Already Implemented**: 7 services (47%)
- 🔴 **Critical to Build**: 3 services (20%)
- 🟡 **Important to Build**: 3 services (20%)
- 🟢 **Nice to Have**: 3 services (20%)

### Timeline Impact

**Original Estimate**: 3-4 weeks

**Revised Estimate**: 2-3 weeks (REDUCED!)

**Reason**: Most auth features already exist. Main work is:
1. Adding brand awareness to existing services (1 week)
2. Implementing Identity Bridge (3-4 days)
3. Data migration scripts (2-3 days)
4. Brand-specific templates (2-3 days)

---

## 🎯 Recommended Implementation Order

### Week 1: Brand Awareness

1. Add brand parameter to email verification
2. Add brand parameter to password reset
3. Add brand isolation to RBAC
4. Add brand tracking to account lockout
5. Add brand-specific email templates
6. Add brand-specific session endpoints

### Week 2: Identity Bridge & Migration

7. Implement Identity Bridge service
8. Create data migration scripts
9. Test migration on staging
10. Add multi-brand health checks

### Week 3: Testing & Documentation

11. Security testing (OWASP)
12. API documentation (OpenAPI)
13. Audit trail enhancements
14. Production deployment

---

## 📝 Files to Modify

### High Priority (Week 1)

1. `apps/api-server/src/modules/email/EmailService.ts` - Add brand templates
2. `apps/api-server/src/modules/auth/signup.service.ts` - Add brand parameter
3. `apps/api-server/src/modules/auth/password-recovery.service.ts` - Add brand parameter
4. `services/skillhubcore-service/src/middleware/verify-jwt.ts` - Add brand isolation
5. `apps/api-server/src/modules/auth/security.service.ts` - Add brand tracking
6. `services/skillhubcore-service/src/modules/auth/auth.routes.ts` - Add session endpoints

### High Priority (Week 2)

7. Create `packages/identity-bridge/` - New Identity Bridge service
8. Create `scripts/migrate-existing-users.ts` - Data migration
9. `apps/api-server/src/modules/core/health.service.ts` - Add multi-brand checks

### Medium Priority (Week 3)

10. Create OpenAPI documentation
11. Add security tests
12. Enhance audit logs

---

## ✅ Conclusion

**Great news!** 47% of the required services already exist in the codebase. The main work is:

1. **Brand Awareness** - Add brand parameters to existing services
2. **Identity Bridge** - Implement shadow user sync
3. **Data Migration** - Migrate existing users safely

This significantly reduces the implementation timeline from 3-4 weeks to 2-3 weeks.

**Next Steps**:
1. Review this document with the team
2. Prioritize Week 1 tasks (brand awareness)
3. Start implementing Identity Bridge
4. Plan data migration strategy
