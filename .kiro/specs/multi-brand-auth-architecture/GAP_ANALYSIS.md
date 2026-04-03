# Multi-Brand Auth Architecture - Gap Analysis

## Overview

This document identifies potential gaps and missing components in the multi-brand authentication architecture implementation plan.

---

## ✅ What's Already Covered

### Core Authentication
- ✅ User registration and login (RTH & SkillUp)
- ✅ JWT token generation and validation
- ✅ Password hashing and verification
- ✅ Identity Bridge for shadow users
- ✅ Cross-domain authentication
- ✅ Cookie management
- ✅ Token refresh and rotation

### Infrastructure
- ✅ Database schemas (rth_prod, skillup_prod, people_prod)
- ✅ API Gateways (RTH, SkillUp, SkillHub)
- ✅ Rate limiting
- ✅ CORS configuration
- ✅ Error handling
- ✅ Logging and telemetry

### Business Features
- ✅ Enquiry management
- ✅ Admission management
- ✅ Payment management
- ✅ Faculty management (SkillUp)
- ✅ Batch scheduling (both brands)
- ✅ Attendance tracking
- ✅ Quiz/Exam engine
- ✅ Tutorial content
- ✅ Placement services

---

## ⚠️ Potential Gaps Identified

### 1. **Email/Notification Service Integration** ✅ EXISTS

**Current State**: 
- ✅ Email service EXISTS: `apps/api-server/src/modules/email/EmailService.ts`
- ✅ Resend provider implemented: `apps/api-server/src/modules/email/providers/ResendEmailProvider.ts`
- ✅ Password reset email template implemented
- ✅ Notification service EXISTS: `apps/api-server/src/modules/notifications/skillup-notifications.service.ts`

**What's Already Implemented**:
```typescript
// EmailService with Resend provider
class EmailService {
  static async sendPasswordResetEmail(email: string, resetUrl: string)
  static async sendEmail(options: EmailOptions)
}
```

**What Needs to be Added**:
- Welcome email template (after registration)
- Email verification template
- Admission confirmation email template
- Payment receipt email template
- Batch enrollment confirmation email template
- Brand-specific templates (RTH vs SkillUp branding)

**Impact**: Core email infrastructure exists, just need additional templates

**Recommendation**:
```typescript
// Extend existing EmailService
Task 2.4: Add Email Templates to Existing Service

Location: apps/api-server/src/modules/email/EmailService.ts

Add methods:
- sendWelcomeEmail(user, brand)
- sendEmailVerification(user, verificationToken, brand)
- sendAdmissionConfirmation(user, admission, brand)
- sendPaymentReceipt(user, payment, brand)
- sendBatchEnrollmentEmail(user, batch, brand)

Brand-specific templates:
- RTH templates with AI tutor branding
- SkillUp templates with physical training branding
```

---

### 2. **Email Verification Flow** ✅ EXISTS

**Current State**:
- ✅ `users.email_verified` column exists in `packages/db/src/schema/auth.ts`
- ✅ `verification_tokens` table exists with token, userId, expiresAt
- ✅ Email verification implemented in `apps/api-server/src/modules/auth/signup.service.ts`
- ✅ Endpoints exist: `POST /auth/verify-email`, `POST /auth/resend-verification`

**What's Already Implemented**:
```typescript
// SignupService
async verifyEmail(token: string, ip?: string) {
  // Validates token, marks email as verified, deletes token
}

async resendVerification(userId: string, ip?: string) {
  // Generates new token, sends verification email
}
```

**What Needs to be Added for Multi-Brand**:
- Brand-aware verification emails (RTH vs SkillUp templates)
- Verification redirect URLs based on brand
- Brand-specific verification token generation

**Impact**: Core verification flow exists, just needs brand awareness

**Recommendation**:
```typescript
// Update existing verification flow for multi-brand
Task 3.5: Add Brand Awareness to Email Verification

Modify SignupService.verifyEmail() to:
- Accept brand parameter
- Use brand-specific email templates
- Redirect to brand-specific success page
```

---

### 3. **Password Reset Flow** ✅ EXISTS

**Current State**:
- ✅ `password_reset_tokens` table exists with token, userId, expiresAt
- ✅ Password reset implemented in `apps/api-server/src/modules/auth/password-recovery.service.ts`
- ✅ Endpoints exist: `POST /auth/forgot-password`, `POST /auth/reset-password`, `GET /auth/reset-password?_token=xxx`
- ✅ Email service sends password reset emails with 60-minute expiry
- ✅ Token validation and cleanup implemented

**What's Already Implemented**:
```typescript
// PasswordRecoveryService
async forgotPassword(email: string, ip?: string) {
  // Generates token, stores in DB, sends email
  // Token expires in 60 minutes
}

async resetPassword(token: string, newPassword: string, ip?: string) {
  // Validates token, updates password, deletes token
}
```

**What Needs to be Added for Multi-Brand**:
- Brand-aware reset URLs (RTH vs SkillUp admin/web apps)
- Brand-specific email templates
- Rate limiting per brand

**Impact**: Core password reset exists, just needs brand awareness

**Recommendation**:
```typescript
// Update existing password reset for multi-brand
Task 3.6: Add Brand Awareness to Password Reset

Modify PasswordRecoveryService.forgotPassword() to:
- Accept brand parameter
- Determine correct reset URL based on brand
- Use brand-specific email templates
```

---

### 4. **Role-Based Access Control (RBAC)** ✅ EXISTS

**Current State**:
- ✅ Roles exist: USER, ADMIN, SUPER_ADMIN, FACULTY
- ✅ `user_roles` table exists with userId, roleId
- ✅ RBAC middleware EXISTS: `services/skillhubcore-service/src/middleware/verify-jwt.ts`
- ✅ `requireAuth` middleware validates JWT and extracts user
- ✅ `requireRoles` middleware enforces role-based access

**What's Already Implemented**:
```typescript
// verify-jwt.ts
export const requireAuth = createMiddleware(async (c, next) => {
  // Validates JWT, extracts user, sets c.get('authUser')
});

export const requireRoles = (allowedRoles: string[]) => {
  return createMiddleware(async (c, next) => {
    const user = c.get('authUser');
    if (!user.roles.some(r => allowedRoles.includes(r))) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    await next();
  });
};
```

**What Needs to be Added for Multi-Brand**:
- Brand-specific role enforcement (RTH roles vs SkillUp roles)
- Cross-brand role isolation (RTH admin ≠ SkillUp admin)

**Impact**: RBAC middleware exists, just needs brand isolation

**Recommendation**:
```typescript
// Update existing RBAC for multi-brand
Task 3.7: Add Brand Isolation to RBAC

Modify requireRoles() to:
- Check user.brand matches route brand
- Prevent cross-brand admin access
- Enforce brand-specific role hierarchies
```

---

### 5. **Account Lockout / Brute Force Protection** ✅ EXISTS

**Current State**:
- ✅ `login_attempts` table exists with userId, ip, attempts, lockedUntil
- ✅ Account lockout implemented in `apps/api-server/src/modules/auth/security.service.ts`
- ✅ Progressive lockout strategy: 5 attempts = 15 min, 10 attempts = 1 hour, 20 attempts = 24 hours
- ✅ Rate limiting exists at API gateway level
- ✅ Login service checks lockout before authentication

**What's Already Implemented**:
```typescript
// SecurityService
async trackLoginAttempt(ip: string, email: string, success: boolean) {
  // Tracks attempts per user+IP
  // Progressive lockout: 5→15min, 10→1hr, 20→24hr
}

async isAccountLocked(email: string, ip: string): Promise<boolean> {
  // Checks if account is locked
  // Auto-unlocks after expiry
}
```

**What Needs to be Added for Multi-Brand**:
- Brand-specific lockout tracking (RTH vs SkillUp)
- Lockout notification emails
- Admin unlock capability per brand

**Impact**: Account lockout exists, just needs brand awareness

**Recommendation**:
```typescript
// Update existing lockout for multi-brand
Task 3.8: Add Brand Awareness to Account Lockout

Modify SecurityService to:
- Track lockouts per brand
- Send brand-specific lockout notification emails
- Allow brand admins to unlock accounts
```

---

### 6. **Session Management** ✅ EXISTS

**Current State**:
- ✅ `sessions` table exists with userId, ip, device, expiresAt
- ✅ `refresh_tokens` table exists with userId, token, expiresAt, revoked, lastActiveAt
- ✅ Session management implemented in `services/skillhubcore-service/src/modules/user/user.repository.ts`
- ✅ Methods: createSession, revokeSession, revokeAllSessions, revokeSessionByFamily
- ✅ JWT tokens with expiry and refresh token rotation

**What's Already Implemented**:
```typescript
// UserRepository
async createSession(data: { userId, jwtFamily, platform, refreshTokenHash })
async revokeSession(userId: string, sessionId: string, reason: string)
async revokeAllSessions(userId: string, reason: string)
async revokeSessionByFamily(userId: string, familyId: string, reason: string)
```

**What Needs to be Added for Multi-Brand**:
- Brand-specific session tracking
- "View all sessions" endpoint per brand
- Cross-brand session isolation

**Impact**: Session management exists, just needs brand awareness

**Recommendation**:
```typescript
// Update existing session management for multi-brand
Task 6.1: Add Brand Awareness to Session Management

Add endpoints:
- GET /auth/sessions - List all active sessions for current brand
- DELETE /auth/sessions/:id - Logout specific session
- DELETE /auth/sessions - Logout all sessions for current brand
```

---

### 7. **Two-Factor Authentication (2FA)** 🟢 NICE TO HAVE

**Current State**: Not implemented

**Missing**:
- 2FA enrollment
- TOTP generation/verification
- Backup codes
- 2FA enforcement for admin accounts

**Recommendation**:
```typescript
// Add to users table
ALTER TABLE users ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE;
ALTER TABLE users ADD COLUMN two_factor_secret TEXT;
ALTER TABLE users ADD COLUMN backup_codes TEXT[];

// Endpoints
POST /auth/2fa/enable
POST /auth/2fa/verify
POST /auth/2fa/disable
GET /auth/2fa/backup-codes
```

---

### 8. **OAuth/Social Login** 🟢 NICE TO HAVE

**Current State**: Not implemented

**Missing**:
- Google OAuth
- GitHub OAuth
- LinkedIn OAuth (for placement)

**Recommendation**:
```typescript
// Add to users table
ALTER TABLE users ADD COLUMN oauth_provider TEXT;
ALTER TABLE users ADD COLUMN oauth_id TEXT;

// Endpoints
GET /auth/google
GET /auth/google/callback
GET /auth/github
GET /auth/github/callback
```

---

### 9. **Audit Trail Enhancements** 🟢 NICE TO HAVE

**Current State**:
- `auth_audit_log` table exists
- Logs login/logout/register

**Missing**:
- Log password changes
- Log email changes
- Log role changes
- Log 2FA enable/disable
- Log session revocations
- Admin action audit trail

**Recommendation**:
```typescript
// Enhance auth_audit_log
ALTER TABLE auth_audit_log ADD COLUMN changed_by UUID REFERENCES users(id);
ALTER TABLE auth_audit_log ADD COLUMN old_value TEXT;
ALTER TABLE auth_audit_log ADD COLUMN new_value TEXT;

// Log all sensitive actions
await logAuditTrail({
  userId: user.id,
  action: 'password_changed',
  ipAddress: req.ip,
  userAgent: req.headers['user-agent'],
  success: true,
  changedBy: user.id, // or admin.id if admin changed it
});
```

---

### 10. **Data Migration Scripts** 🔴 CRITICAL

**Current State**:
- Design mentions migration scripts
- But no detailed migration plan

**Missing**:
- Migrate existing users from quiz_platform_prod to rth_prod
- Migrate existing users from quiz_platform_prod to skillup_prod
- Sync all users to people_prod
- Handle duplicate emails across brands
- Preserve user data (quiz results, tutorial progress, etc.)

**Recommendation**:
```typescript
// Add to Phase 9: Testing and Deployment
Task 33: Data Migration Scripts

scripts/migrate-existing-users.ts:
1. Query all users from quiz_platform_prod
2. Determine brand based on:
   - User's platform field
   - User's enrollment in batches (AI vs Faculty)
   - User's admission type (digital vs training)
3. Insert into rth_prod or skillup_prod
4. Sync to people_prod via Identity Bridge
5. Verify shadow user IDs match
6. Update all foreign keys in quiz_platform_prod, tutorial_prod
7. Run validation queries
8. Create rollback script

CRITICAL: Test on staging first!
```

---

### 11. **Brand Detection Logic** 🟡 IMPORTANT

**Current State**:
- Design assumes brand is known from domain
- But what about API calls?

**Missing**:
- How to detect brand from JWT token
- How to detect brand from API request
- What if user has accounts on both brands?

**Recommendation**:
```typescript
// JWT token should include brand claim
{
  userId: "uuid",
  shadowUserId: "uuid",
  email: "user@example.com",
  brand: "realtutorialhub", // or "skillup"
  roles: ["USER"]
}

// API Gateway extracts brand from:
1. JWT token (if authenticated)
2. Host header (user.realtutorialhub.com vs user.skillupitacademy.com)
3. x-brand header (for cross-domain calls)

// Edge case: User with same email on both brands
- These are DIFFERENT users
- Different passwords
- Different shadow users in people_prod
- No cross-brand login
```

---

### 12. **Health Checks and Monitoring** ✅ EXISTS

**Current State**:
- ✅ Health service implemented: `apps/api-server/src/modules/core/health.service.ts`
- ✅ Endpoints: `GET /api/health/live`, `GET /api/health/ready`, `GET /api/status`
- ✅ Database connectivity checks with latency tracking
- ✅ Cache connectivity checks with usage metrics
- ✅ Comprehensive health reports with component status
- ✅ Metrics recording with `recordTimer()` function

**What's Already Implemented**:
```typescript
// HealthService
static getLivenessReport() {
  // Simple process alive check
}

static async getReadinessReport(): Promise<HealthReport> {
  // Checks database, cache connectivity
  // Returns status: healthy | unhealthy | degraded
  // Includes latency metrics
}
```

**What Needs to be Added for Multi-Brand**:
- Identity Bridge health checks
- Brand-specific service health checks
- Auth service health checks (RTH, SkillUp)
- Metrics dashboard for multi-brand architecture

**Impact**: Core health checks exist, just need multi-brand extensions

**Recommendation**:
```typescript
// Extend existing health checks for multi-brand
Task 12.1: Add Multi-Brand Health Checks

Add to HealthService:
- checkIdentityBridge() - Verify shadow user sync
- checkRthAuthService() - RTH auth service health
- checkSkillUpAuthService() - SkillUp auth service health
- checkCrossServiceConnectivity() - Verify all services can communicate
```

---

### 13. **GDPR Compliance** 🟢 NICE TO HAVE

**Current State**:
- Soft deletes implemented
- But no data export/deletion flow

**Missing**:
- User data export (GDPR right to access)
- User data deletion (GDPR right to be forgotten)
- Data retention policies
- Cookie consent management

**Recommendation**:
```typescript
// Endpoints
GET /auth/export-data - Export all user data as JSON
DELETE /auth/delete-account - Soft delete user and anonymize data

// Data retention
- Soft deleted users: Keep for 90 days, then hard delete
- Auth audit logs: Keep for 1 year
- Payment records: Keep for 7 years (legal requirement)
```

---

### 14. **API Documentation** 🟡 IMPORTANT

**Current State**: Not mentioned in design

**Missing**:
- OpenAPI/Swagger docs for all auth endpoints
- API versioning strategy
- Deprecation policy

**Recommendation**:
```typescript
// Add to each auth service
GET /api-docs - Swagger UI
GET /openapi.json - OpenAPI spec

// Version all APIs
/v1/auth/login
/v1/auth/register

// Deprecation headers
X-API-Deprecated: true
X-API-Sunset: 2026-12-31
```

---

### 15. **Testing Gaps** 🟡 IMPORTANT

**Current State**:
- Unit tests (90%+ coverage)
- Property tests
- Integration tests
- E2E tests
- Load tests

**Missing**:
- Security testing (OWASP Top 10)
- Penetration testing
- SQL injection testing
- XSS testing
- CSRF testing

**Recommendation**:
```bash
# Add to Phase 9: Testing
Task 42.4: Security Testing

Tools:
- OWASP ZAP for automated security scanning
- Burp Suite for manual testing
- SQLMap for SQL injection testing
- npm audit for dependency vulnerabilities

Tests:
- SQL injection on all input fields
- XSS on all text inputs
- CSRF on all state-changing operations
- JWT tampering attempts
- Rate limit bypass attempts
- Session fixation attacks
```

---

## 📋 Prioritized Action Items

### ✅ Already Implemented (Just Need Brand Awareness)

1. **Email Service** ✅ - Core service exists, add brand-specific templates
2. **Email Verification** ✅ - Flow exists, add brand awareness
3. **Password Reset** ✅ - Flow exists, add brand-specific URLs
4. **RBAC Middleware** ✅ - Middleware exists, add brand isolation
5. **Account Lockout** ✅ - Lockout exists, add brand tracking
6. **Session Management** ✅ - Sessions exist, add brand-specific endpoints
7. **Health Checks** ✅ - Health checks exist, add multi-brand extensions

### 🔴 Critical (Must Have Before Launch)

8. **Data Migration Scripts** - Migrate existing users safely
9. **Brand Detection Logic** - Ensure correct brand routing
10. **Identity Bridge Implementation** - Sync brand users to shadow users

### 🟡 Important (Should Have Soon)

11. **API Documentation** - Help developers integrate
12. **Security Testing** - Find vulnerabilities before hackers do
13. **Audit Trail Enhancements** - Better compliance

### 🟢 Nice to Have (Future Enhancements)

14. **2FA** - Enhanced security for sensitive accounts
15. **OAuth/Social Login** - Easier onboarding
16. **GDPR Compliance** - Legal requirement for EU users

---

## 🎯 Recommended Implementation Order

### Phase 1-6: Core Auth (As Planned)
Continue with existing plan

### Phase 7: Add Critical Missing Features
1. Email service integration
2. Email verification flow
3. Password reset flow
4. RBAC middleware
5. Account lockout

### Phase 8: Frontend Updates (As Planned)
Continue with existing plan

### Phase 9: Data Migration & Testing
1. Create migration scripts
2. Test on staging
3. Run security tests
4. Migrate production data
5. Deploy

### Phase 10: Post-Launch Enhancements
1. Session management
2. 2FA
3. OAuth/Social login
4. GDPR compliance

---

## 📝 Updated Tasks to Add/Modify

### ✅ Task 2.4: Extend Existing Email Service (MODIFY EXISTING)
```
Location: apps/api-server/src/modules/email/EmailService.ts
Status: Service exists, add brand-specific templates

Add methods:
- sendWelcomeEmail(user, brand)
- sendEmailVerification(user, verificationToken, brand)
- sendAdmissionConfirmation(user, admission, brand)
- sendPaymentReceipt(user, payment, brand)
- sendBatchEnrollmentEmail(user, batch, brand)

Templates:
- Create RTH-branded email templates
- Create SkillUp-branded email templates
```

### ✅ Task 3.5: Add Brand Awareness to Email Verification (MODIFY EXISTING)
```
Location: apps/api-server/src/modules/auth/signup.service.ts
Status: Verification exists, add brand parameter

Modify:
- verifyEmail(token, ip, brand) - Add brand parameter
- resendVerification(userId, ip, brand) - Add brand parameter
- Use brand-specific email templates
- Redirect to brand-specific success page
```

### ✅ Task 3.6: Add Brand Awareness to Password Reset (MODIFY EXISTING)
```
Location: apps/api-server/src/modules/auth/password-recovery.service.ts
Status: Password reset exists, add brand-specific URLs

Modify:
- forgotPassword(email, ip, brand) - Add brand parameter
- Determine reset URL based on brand (RTH vs SkillUp)
- Use brand-specific email templates
```

### ✅ Task 3.7: Add Brand Isolation to RBAC (MODIFY EXISTING)
```
Location: services/skillhubcore-service/src/middleware/verify-jwt.ts
Status: RBAC exists, add brand isolation

Modify:
- requireRoles() - Check user.brand matches route brand
- Prevent cross-brand admin access
- Enforce brand-specific role hierarchies
```

### ✅ Task 3.8: Add Brand Awareness to Account Lockout (MODIFY EXISTING)
```
Location: apps/api-server/src/modules/auth/security.service.ts
Status: Lockout exists, add brand tracking

Modify:
- trackLoginAttempt(ip, email, success, brand) - Add brand parameter
- isAccountLocked(email, ip, brand) - Add brand parameter
- Send brand-specific lockout notification emails
```

### ✅ Task 6.1: Add Brand-Specific Session Endpoints (NEW)
```
Location: services/skillhubcore-service/src/modules/auth/auth.routes.ts
Status: Session management exists, add endpoints

Add endpoints:
- GET /auth/sessions - List all active sessions for current brand
- DELETE /auth/sessions/:id - Logout specific session
- DELETE /auth/sessions - Logout all sessions for current brand
```

### ✅ Task 12.1: Add Multi-Brand Health Checks (EXTEND EXISTING)
```
Location: apps/api-server/src/modules/core/health.service.ts
Status: Health checks exist, add multi-brand extensions

Add methods:
- checkIdentityBridge() - Verify shadow user sync
- checkRthAuthService() - RTH auth service health
- checkSkillUpAuthService() - SkillUp auth service health
- checkCrossServiceConnectivity() - Verify all services can communicate
```

### Task 9.3: Create Data Migration Scripts
```
Migrate users from quiz_platform_prod
Determine brand for each user
Insert into rth_prod or skillup_prod
Sync to people_prod
Verify data integrity
Create rollback script
```

### Task 9.4: Security Testing
```
Run OWASP ZAP scan
Test SQL injection
Test XSS
Test CSRF
Test JWT tampering
Test rate limit bypass
Fix all critical vulnerabilities
```

---

## ✅ Conclusion

The multi-brand auth architecture is **well-designed** and **most core features already exist**!

### 🎉 Great News: 7 out of 15 gaps are already implemented!

**Already Implemented** (just need brand awareness):
- ✅ Email service with Resend provider
- ✅ Email verification flow with tokens
- ✅ Password reset flow with 60-min expiry
- ✅ RBAC middleware with role enforcement
- ✅ Account lockout with progressive strategy
- ✅ Session management with revocation
- ✅ Health checks with latency tracking

**Must Implement Before Launch**:
- 🔴 Data migration scripts (migrate existing users)
- 🔴 Brand detection logic (route to correct brand)
- 🔴 Identity Bridge (sync brand users to shadow users)
- 🔴 Brand-specific email templates
- 🔴 Brand isolation in RBAC

**Should Implement Soon**:
- 🟡 API documentation (OpenAPI/Swagger)
- 🟡 Security testing (OWASP Top 10)
- 🟡 Audit trail enhancements

**Can Add Later**:
- 🟢 2FA
- 🟢 OAuth/Social login
- 🟢 GDPR compliance

### 📊 Impact on Timeline

**Original Estimate**: 3-4 weeks

**Revised Estimate**: 2-3 weeks (REDUCED!)

**Reason**: Most auth features already exist. Main work is:
1. Adding brand awareness to existing services
2. Implementing Identity Bridge
3. Data migration scripts
4. Brand-specific templates

**Recommendation**: Focus on brand isolation and Identity Bridge implementation. The heavy lifting (auth, security, health checks) is already done!


---

## 🔍 CODE VS GUIDELINE GAP ANALYSIS (April 3, 2026)

**Purpose**: Detailed comparison between the target architecture (guideline) and actual implemented code

**Method**: Direct code inspection, not based on .md file claims

**Status**: ⚠️ MIXED IMPLEMENTATION - Some parts follow guideline, some contradict it

---

### 📊 Gap Analysis Table

| # | Component | Guideline Requirement | Current Implementation | Gap Status | Action Needed |
|---|-----------|----------------------|------------------------|------------|---------------|
| 1 | **Portal Identity** | Fixed portal identity, never hostname-derived | ✅ Fixed at login (`x-portal-identity: 'user'`)<br>❌ Host-derived in gateway (`detectRequestPortal()`) | 🟡 PARTIAL | Remove hostname detection from gateway, use only fixed identity from token |
| 2 | **Admin Auth Cookies** | Uniform admin auth across brands | ✅ RTH: `admin_accessToken`<br>❌ SkillUp: `accessToken` (user token)<br>❌ Faculty: `accessToken` (user token) | 🔴 INCONSISTENT | Standardize: RTH admin pattern for all brands, or normalize to single pattern |
| 3 | **Faculty Portal** | Separate portal type like admin/user | ❌ Role-based user token with `REQUIRED_ROLES = ['faculty']` | 🔴 DIFFERENT | Decide: Keep role-based OR create separate faculty token type |
| 4 | **Shared Service Cookies** | `skillhub_accessToken` / `skillhub_refreshToken` | ❌ `skillhubcore_accessToken`<br>❌ Bearer-first, not cookie-first | 🔴 DIFFERENT | Rename cookies OR update guideline to match implementation |
| 5 | **Token Shape** | `{ shadowUserId, brand, originalUserId, roles }` | ❌ `{ sub, roles, subscriptions, platforms, brand? }` | 🔴 DIFFERENT | Align token contract: either update code to use shadowUserId OR update guideline |
| 6 | **DB Operations** | Always use `shadowUserId` for shared services | ❌ Uses `authUser.id = payload.sub`<br>❌ No first-class `shadowUserId` field | 🔴 NOT ENFORCED | Add `shadowUserId` to auth context, enforce in all shared services |
| 7 | **Cross-Domain Auth** | Formal `/auth/callback?token=...&brand=...` flow | ❌ No uniform callback endpoint found | 🔴 NOT IMPLEMENTED | Implement callback flow OR document actual handoff mechanism |
| 8 | **Brand Cookies** | Brand-scoped domains (`.realtutorialhub.com`, `.skillupitacademy.com`) | ✅ Implemented via `resolveCookieDomain()` | 🟢 MATCHES | None - working correctly |
| 9 | **Fixed Portal at Login** | Fixed `x-portal-identity` header | ✅ RTH: `'x-portal-identity': 'user'`<br>✅ SkillUp: `'x-portal-identity': 'user'` | 🟢 MATCHES | None - working correctly |

---

### 📝 Detailed Gap Descriptions

#### Gap 1: Portal Identity (PARTIAL MATCH)

**Guideline Says**:
```typescript
// Fixed portal identity, never hostname-derived
const portalIdentity = 'user'; // or 'admin' or 'faculty'
```

**Current Code**:

✅ **Brand Portals DO Use Fixed Identity**:
```typescript
// apps/realtutorialhub-web/src/app/login/LoginClient.tsx
headers: {
  'x-portal-identity': 'user',  // ✅ FIXED
}

// apps/skillup-web/src/components/auth/LoginForm.tsx
headers: {
  'x-portal-identity': 'user',  // ✅ FIXED
}
```

❌ **BUT Gateway STILL Derives from Hostname**:
```typescript
// services/api-gateway/src/middleware/auth.ts
export function detectRequestPortal(request: Request, route?: RouteLike): PortalKind {
  const hostname = requestUrl.hostname.toLowerCase();
  const originHost = parseHostname(request.headers.get('origin'));
  
  if (route?.requireRole === 'admin' || route?.prefix === '/admin') {
    return 'admin';  // ❌ ROUTE-BASED
  }
  
  if (originHost?.startsWith('admin.') === true) {
    return 'admin';  // ❌ HOSTNAME-BASED
  }
  
  if (hostname.startsWith('admin.') === true) {
    return 'admin';  // ❌ HOSTNAME-BASED
  }
  
  return 'user';
}
```

**Action Needed**:
1. Remove hostname detection from gateway
2. Extract portal identity from JWT token (add to token payload)
3. Use only token-based portal detection

---

#### Gap 2: Admin Auth Inconsistency (INCONSISTENT)

**Guideline Says**: Uniform admin authentication across all brands

**Current Code**:

**RTH Admin** (`apps/realtutorialhub-admin/src/proxy.ts`):
```typescript
function getAccessToken(request: NextRequest): string | undefined {
  return request.cookies.get('admin_accessToken')?.value;  // ✅ Admin-specific cookie
}
// No JWT verification, just cookie presence check
```

**SkillUp Admin** (`apps/skillup-admin/src/proxy.ts`):
```typescript
function getAccessToken(request: NextRequest): string | undefined {
  return request.cookies.get('accessToken')?.value;  // ❌ User cookie
}

async function resolveUser(request: NextRequest): Promise<UserPayload | null> {
  const token = getAccessToken(request);
  const payload = await TokenService.verifyUserAccessToken(token, { audience: 'user' });  // ❌ User token
  return { sub: userId, roles: payload.roles ?? [] };
}

function hasRequiredRole(payload: UserPayload): boolean {
  return payload.roles.some((role) => REQUIRED_ROLES.includes(role));  // ❌ Role check
}
```

**Faculty App** (`apps/faculty-app/src/proxy.ts`):
```typescript
// Same as SkillUp Admin - uses accessToken + role check
const REQUIRED_ROLES = ['faculty', 'super_admin'];
```

**Action Needed**:
1. **Option A**: Standardize all to RTH pattern (admin_accessToken everywhere)
2. **Option B**: Standardize all to SkillUp pattern (accessToken + role check everywhere)
3. **Option C**: Keep different patterns but document why

---

#### Gap 3: Faculty Portal Type (DIFFERENT)

**Guideline Says**: Faculty should be a separate portal type like admin/user

**Current Code**:
```typescript
// apps/faculty-app/src/proxy.ts
const REQUIRED_ROLES = ['faculty', 'super_admin'];

async function resolveUser(request: NextRequest): Promise<UserPayload | null> {
  const payload = await TokenService.verifyUserAccessToken(token, { audience: 'user' });
  // ❌ Verifies as USER token, not separate faculty token
}
```

**Action Needed**:
1. **Option A**: Create separate faculty token type (like admin)
2. **Option B**: Keep role-based approach, update guideline
3. Document the chosen approach

---

#### Gap 4: Shared Service Cookie Names (DIFFERENT)

**Guideline Says**: `skillhub_accessToken` / `skillhub_refreshToken`

**Current Code**:
```typescript
// apps/skillhubcore-admin/src/proxy.ts
function getSkillHubCoreToken(request: NextRequest): string | undefined {
  return request.cookies.get('skillhubcore_accessToken')?.value ??  // ❌ Different name
         request.cookies.get('accessToken')?.value;
}

// services/skillhubcore-service/src/middleware/verify-jwt.ts
const token = c.req.header('authorization')?.replace('Bearer ', '');
// ❌ Bearer-first, not cookie-first
```

**Action Needed**:
1. **Option A**: Rename to `skillhub_accessToken` (match guideline)
2. **Option B**: Update guideline to `skillhubcore_accessToken` (match code)
3. Decide on cookie-first vs bearer-first strategy

---

#### Gap 5: Token Shape (DIFFERENT)

**Guideline Says**:
```typescript
{
  shadowUserId: string,
  brand: 'realtutorialhub' | 'skillup',
  originalUserId: string,
  roles: string[]
}
```

**Current Code**:
```typescript
// services/skillhubcore-service/src/middleware/verify-jwt.ts
c.set('authUser', {
  id: payload.sub,                    // ❌ NOT shadowUserId
  roles: payload.roles,               // ✅ MATCHES
  subscriptions: payload.subscriptions,  // ❌ NOT in guideline
  platforms: payload.platforms,       // ❌ NOT in guideline
  brand?: activeBrand,                // ✅ MATCHES (optional)
});
```

**Action Needed**:
1. Add `shadowUserId` to token payload
2. Update middleware to expose `authUser.shadowUserId`
3. Deprecate `authUser.id` in favor of `authUser.shadowUserId`
4. OR update guideline to match current contract

---

#### Gap 6: shadowUserId Not Enforced (NOT ENFORCED)

**Guideline Says**: "Always use shadowUserId for database operations in shared services"

**Current Code**:
```typescript
// services/skillhubcore-service/src/middleware/verify-jwt.ts
c.set('authUser', {
  id: payload.sub,  // ❌ Sets 'id', not 'shadowUserId'
  // ...
});

// Shared services then use:
const userId = c.get('authUser').id;  // ❌ No guarantee this is shadowUserId
```

**Action Needed**:
1. Add `shadowUserId` field to auth context
2. Update all shared services to use `authUser.shadowUserId`
3. Add TypeScript types to enforce this pattern
4. Add runtime validation to ensure shadowUserId is present

---

#### Gap 7: No Uniform Callback Flow (NOT IMPLEMENTED)

**Guideline Says**:
```typescript
// Step 1: Brand portal redirects with token
window.location.href = `https://quiz.skillhubcore.in/auth/callback?token=${accessToken}&brand=realtutorialhub`;

// Step 2: SkillHub validates token
POST https://api.skillhubcore.in/auth/validate
Headers: {
  'Authorization': 'Bearer jwt-token',
  'x-brand': 'realtutorialhub'
}

// Step 3: SkillHub sets cookies
Cookies: {
  skillhub_accessToken: { domain: '.skillhubcore.in' }
}
```

**Current Code**: No such uniform callback endpoint found

**Action Needed**:
1. **Option A**: Implement the callback flow as described
2. **Option B**: Document the actual cross-domain handoff mechanism
3. **Option C**: Use a different approach (e.g., shared session store)

---

### 🎯 Priority Matrix

| Priority | Gap # | Component | Impact | Effort | Risk |
|----------|-------|-----------|--------|--------|------|
| 🔴 P0 | 6 | shadowUserId enforcement | HIGH | HIGH | HIGH |
| 🔴 P0 | 5 | Token shape alignment | HIGH | MEDIUM | HIGH |
| 🔴 P1 | 7 | Cross-domain auth flow | HIGH | HIGH | MEDIUM |
| 🟡 P2 | 2 | Admin auth consistency | MEDIUM | MEDIUM | LOW |
| 🟡 P2 | 1 | Portal identity detection | MEDIUM | LOW | LOW |
| 🟢 P3 | 4 | Cookie naming | LOW | LOW | LOW |
| 🟢 P3 | 3 | Faculty portal type | LOW | LOW | LOW |

---

### 📋 Recommended Action Plan

#### Phase 1: Critical Alignment (Week 1)

**Day 1-2: Token Shape & shadowUserId**
```typescript
// 1. Update token generation to include shadowUserId
const accessToken = jwt.sign({
  sub: shadowUserId,           // ← Use shadowUserId as subject
  userId: brandUserId,         // ← Keep original for reference
  shadowUserId,                // ← Explicit field
  brand: 'realtutorialhub',
  roles: ['user'],
  platforms: ['realtutorialhub']
}, JWT_SECRET);

// 2. Update middleware to expose shadowUserId
c.set('authUser', {
  id: payload.sub,              // ← Keep for backward compat
  shadowUserId: payload.shadowUserId,  // ← Add explicit field
  originalUserId: payload.userId,
  roles: payload.roles,
  platforms: payload.platforms,
  brand: activeBrand,
});

// 3. Update all shared services
const userId = c.get('authUser').shadowUserId;  // ← Use shadowUserId
```

**Day 3-4: Cross-Domain Auth Flow**
```typescript
// 1. Create callback endpoint
// services/skillhubcore-service/src/modules/auth/auth.routes.ts
app.get('/auth/callback', async (c) => {
  const token = c.req.query('token');
  const brand = c.req.query('brand');
  
  // Validate token
  const payload = await validateBrandToken(token, brand);
  
  // Generate SkillHub token
  const skillhubToken = await generateSkillHubToken(payload);
  
  // Set cookies
  setCookie(c, 'skillhub_accessToken', skillhubToken, {
    domain: '.skillhubcore.in'
  });
  
  // Redirect to requested service
  return c.redirect('/dashboard');
});
```

**Day 5: Portal Identity from Token**
```typescript
// Remove hostname detection, use token
export function detectRequestPortal(payload: TokenPayload): PortalKind {
  return payload.portalIdentity ?? 'user';  // From token, not hostname
}
```

#### Phase 2: Consistency Improvements (Week 2)

**Day 1-2: Admin Auth Standardization**
- Decide on pattern (admin_accessToken vs accessToken + roles)
- Update all admin portals to use same pattern
- Update documentation

**Day 3: Cookie Naming**
- Decide on `skillhub_` vs `skillhubcore_`
- Update all references
- Update documentation

**Day 4: Faculty Portal Type**
- Decide on separate token vs role-based
- Implement chosen approach
- Update documentation

#### Phase 3: Documentation (Week 3)

**Day 1-2: Update Guideline Documents**
- Update ARCHITECTURE_SUMMARY.md with actual implementation
- Update requirements.md with current patterns
- Create IMPLEMENTATION_REALITY.md documenting actual vs ideal

**Day 3: Create Migration Guide**
- Document how to migrate from current to ideal
- Provide backward compatibility strategy
- Create deprecation timeline

---

### ✅ Success Criteria

**Phase 1 Complete When**:
- [ ] All tokens include `shadowUserId` field
- [ ] All shared services use `shadowUserId` for DB operations
- [ ] Cross-domain auth callback flow implemented
- [ ] Portal identity comes from token, not hostname
- [ ] All tests passing

**Phase 2 Complete When**:
- [ ] Admin auth consistent across all brands
- [ ] Cookie naming standardized
- [ ] Faculty portal type decided and implemented
- [ ] All tests passing

**Phase 3 Complete When**:
- [ ] All documentation updated
- [ ] Migration guide published
- [ ] Team trained on new patterns
- [ ] Backward compatibility verified

---

**Last Updated**: April 3, 2026  
**Method**: Direct code inspection  
**Status**: Gap analysis complete, action plan defined  
**Next Review**: After Phase 1 completion  
**Owner**: Development Team
