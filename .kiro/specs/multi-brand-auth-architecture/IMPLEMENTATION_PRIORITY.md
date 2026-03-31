# Multi-Brand Auth Implementation Priority Guide

## Quick Reference: What to Do Next

**Last Updated**: March 30, 2026  
**Status**: Ready to implement

---

## 🎯 Executive Summary

**Good News**: 7 out of 15 required services already exist!

**Timeline**: 2-3 weeks (reduced from 3-4 weeks)

**Main Work**:
1. Add brand awareness to existing services (1 week)
2. Implement Identity Bridge (3-4 days)
3. Data migration scripts (2-3 days)

---

## 📋 Week 1: Brand Awareness (5-7 days)

### Day 1-2: Email Templates

**Task**: Add brand-specific email templates

**Files to Modify**:
- `apps/api-server/src/modules/email/EmailService.ts`

**What to Add**:
```typescript
// Add these methods to EmailService
static async sendWelcomeEmail(email: string, name: string, brand: 'rth' | 'skillup')
static async sendEmailVerification(email: string, token: string, brand: 'rth' | 'skillup')
static async sendAdmissionConfirmation(email: string, admission: any, brand: 'rth' | 'skillup')
static async sendPaymentReceipt(email: string, payment: any, brand: 'rth' | 'skillup')
static async sendBatchEnrollmentEmail(email: string, batch: any, brand: 'rth' | 'skillup')
```

**Templates Needed**:
- RTH-branded templates (AI tutor theme)
- SkillUp-branded templates (physical training theme)

---

### Day 3: Email Verification Brand Awareness

**Task**: Add brand parameter to email verification

**Files to Modify**:
- `apps/api-server/src/modules/auth/signup.service.ts`

**What to Change**:
```typescript
// Before
async verifyEmail(token: string, ip?: string)
async resendVerification(userId: string, ip?: string)

// After
async verifyEmail(token: string, ip?: string, brand?: 'rth' | 'skillup')
async resendVerification(userId: string, ip?: string, brand?: 'rth' | 'skillup')
```

**Logic to Add**:
- Use brand-specific email templates
- Redirect to brand-specific success page
- Track verification by brand in audit logs

---

### Day 4: Password Reset Brand Awareness

**Task**: Add brand parameter to password reset

**Files to Modify**:
- `apps/api-server/src/modules/auth/password-recovery.service.ts`

**What to Change**:
```typescript
// Before
async forgotPassword(email: string, ip?: string)
async resetPassword(token: string, newPassword: string, ip?: string)

// After
async forgotPassword(email: string, ip?: string, brand?: 'rth' | 'skillup')
async resetPassword(token: string, newPassword: string, ip?: string, brand?: 'rth' | 'skillup')
```

**Logic to Add**:
- Determine reset URL based on brand:
  - RTH: `https://user.realtutorialhub.com/reset-password?token=xxx`
  - SkillUp: `https://user.skillupitacademy.com/reset-password?token=xxx`
- Use brand-specific email templates

---

### Day 5: RBAC Brand Isolation

**Task**: Add brand isolation to RBAC middleware

**Files to Modify**:
- `services/skillhubcore-service/src/middleware/verify-jwt.ts`

**What to Change**:
```typescript
// Add brand checking to requireRoles
export const requireRoles = (allowedRoles: string[], requireBrand?: 'rth' | 'skillup') => {
  return createMiddleware(async (c, next) => {
    const user = c.get('authUser');
    
    // Check roles
    if (!user.roles.some(r => allowedRoles.includes(r))) {
      return c.json({ error: 'Forbidden' }, 403);
    }
    
    // Check brand isolation
    if (requireBrand && user.brand !== requireBrand) {
      return c.json({ error: 'Cross-brand access denied' }, 403);
    }
    
    await next();
  });
};
```

**Logic to Add**:
- Prevent RTH admin from accessing SkillUp routes
- Prevent SkillUp admin from accessing RTH routes
- Allow SUPER_ADMIN cross-brand access (optional)

---

### Day 6: Account Lockout Brand Tracking

**Task**: Add brand tracking to account lockout

**Files to Modify**:
- `apps/api-server/src/modules/auth/security.service.ts`

**What to Change**:
```typescript
// Before
async trackLoginAttempt(ip: string, email: string, success: boolean)
async isAccountLocked(email: string, ip: string): Promise<boolean>

// After
async trackLoginAttempt(ip: string, email: string, success: boolean, brand?: 'rth' | 'skillup')
async isAccountLocked(email: string, ip: string, brand?: 'rth' | 'skillup'): Promise<boolean>
```

**Logic to Add**:
- Track lockouts per brand (RTH lockout ≠ SkillUp lockout)
- Send brand-specific lockout notification emails
- Allow brand admins to unlock accounts

---

### Day 7: Session Management Endpoints

**Task**: Add brand-specific session endpoints

**Files to Modify**:
- `services/skillhubcore-service/src/modules/auth/auth.routes.ts`

**What to Add**:
```typescript
// Add these endpoints
app.get('/auth/sessions', requireAuth, async (c) => {
  const user = c.get('authUser');
  const sessions = await authService.getUserSessions(user.id, user.brand);
  return c.json({ sessions });
});

app.delete('/auth/sessions/:id', requireAuth, async (c) => {
  const user = c.get('authUser');
  const sessionId = c.req.param('id');
  await authService.revokeSession(user.id, sessionId, user.brand);
  return c.json({ success: true });
});

app.delete('/auth/sessions', requireAuth, async (c) => {
  const user = c.get('authUser');
  await authService.revokeAllSessions(user.id, user.brand);
  return c.json({ success: true });
});
```

---

## 📋 Week 2: Identity Bridge & Migration (5-7 days)

### Day 8-10: Identity Bridge Implementation

**Task**: Implement Identity Bridge service

**Files to Create**:
- `packages/identity-bridge/src/index.ts`
- `packages/identity-bridge/src/bridge.service.ts`
- `packages/identity-bridge/src/types.ts`

**What to Implement**:
```typescript
// IdentityBridgeService
class IdentityBridgeService {
  // Create shadow user in people_prod when brand user registers
  async createShadowUser(brandUser: BrandUser, brand: 'rth' | 'skillup'): Promise<ShadowUser>
  
  // Link brand user to shadow user
  async linkBrandUser(brandUserId: string, shadowUserId: string, brand: 'rth' | 'skillup'): Promise<void>
  
  // Get shadow user ID from brand user ID
  async getShadowUserId(brandUserId: string, brand: 'rth' | 'skillup'): Promise<string>
  
  // Sync brand user updates to shadow user
  async syncUserUpdate(brandUserId: string, updates: Partial<User>, brand: 'rth' | 'skillup'): Promise<void>
  
  // Health check
  async checkHealth(): Promise<{ status: 'healthy' | 'unhealthy', latency: number }>
}
```

**Database Changes**:
```sql
-- Add to rth_prod.users
ALTER TABLE users ADD COLUMN shadow_user_id UUID;
ALTER TABLE users ADD CONSTRAINT fk_shadow_user FOREIGN KEY (shadow_user_id) REFERENCES people_prod.users(id);

-- Add to skillup_prod.users
ALTER TABLE users ADD COLUMN shadow_user_id UUID;
ALTER TABLE users ADD CONSTRAINT fk_shadow_user FOREIGN KEY (shadow_user_id) REFERENCES people_prod.users(id);
```

---

### Day 11-12: Data Migration Scripts

**Task**: Create data migration scripts

**Files to Create**:
- `scripts/migrate-existing-users.ts`
- `scripts/validate-migration.ts`
- `scripts/rollback-migration.ts`

**Migration Logic**:
```typescript
// scripts/migrate-existing-users.ts
async function migrateUsers() {
  // 1. Query all users from quiz_platform_prod
  const existingUsers = await db.query.users.findMany();
  
  // 2. Determine brand for each user
  for (const user of existingUsers) {
    const brand = determineBrand(user);
    
    // 3. Insert into rth_prod or skillup_prod
    const brandUser = await insertBrandUser(user, brand);
    
    // 4. Create shadow user in people_prod
    const shadowUser = await identityBridge.createShadowUser(brandUser, brand);
    
    // 5. Link brand user to shadow user
    await identityBridge.linkBrandUser(brandUser.id, shadowUser.id, brand);
    
    // 6. Verify link
    await validateUserLink(brandUser.id, shadowUser.id, brand);
  }
  
  // 7. Update foreign keys in shared services
  await updateForeignKeys();
  
  // 8. Run validation queries
  await validateMigration();
}

function determineBrand(user: User): 'rth' | 'skillup' {
  // Logic to determine brand:
  // - Check user's platform field
  // - Check user's batch enrollment (AI tutor vs Faculty)
  // - Check user's admission type (digital vs training)
  // - Default to RTH if unclear
}
```

**Validation Queries**:
```sql
-- Verify all brand users have shadow users
SELECT COUNT(*) FROM rth_prod.users WHERE shadow_user_id IS NULL;
SELECT COUNT(*) FROM skillup_prod.users WHERE shadow_user_id IS NULL;

-- Verify shadow users exist in people_prod
SELECT COUNT(*) FROM rth_prod.users u 
LEFT JOIN people_prod.users s ON u.shadow_user_id = s.id 
WHERE s.id IS NULL;

-- Verify no duplicate emails within same brand
SELECT email, COUNT(*) FROM rth_prod.users GROUP BY email HAVING COUNT(*) > 1;
SELECT email, COUNT(*) FROM skillup_prod.users GROUP BY email HAVING COUNT(*) > 1;
```

---

### Day 13-14: Multi-Brand Health Checks

**Task**: Add multi-brand health checks

**Files to Modify**:
- `apps/api-server/src/modules/core/health.service.ts`

**What to Add**:
```typescript
// Add to HealthService
private static async checkIdentityBridge(): Promise<ComponentStatus> {
  const start = Date.now();
  try {
    const health = await identityBridge.checkHealth();
    return {
      status: health.status === 'healthy' ? 'up' : 'down',
      latencyMs: Date.now() - start,
      details: { bridgeLatency: health.latency }
    };
  } catch (error) {
    return {
      status: 'down',
      message: error.message,
      latencyMs: Date.now() - start
    };
  }
}

private static async checkRthAuthService(): Promise<ComponentStatus> {
  // Check RTH auth service health
}

private static async checkSkillUpAuthService(): Promise<ComponentStatus> {
  // Check SkillUp auth service health
}

private static async checkCrossServiceConnectivity(): Promise<ComponentStatus> {
  // Verify all services can communicate
}
```

---

## 📋 Week 3: Testing & Documentation (3-5 days)

### Day 15-16: Security Testing

**Task**: Run security tests

**Tools**:
- OWASP ZAP for automated scanning
- Burp Suite for manual testing
- SQLMap for SQL injection testing

**Tests to Run**:
1. SQL injection on all input fields
2. XSS on all text inputs
3. CSRF on all state-changing operations
4. JWT tampering attempts
5. Rate limit bypass attempts
6. Session fixation attacks
7. Password reset token enumeration
8. Email verification token enumeration

**Files to Create**:
- `tests/security/sql-injection.test.ts`
- `tests/security/xss.test.ts`
- `tests/security/csrf.test.ts`
- `tests/security/jwt-tampering.test.ts`

---

### Day 17: API Documentation

**Task**: Create OpenAPI documentation

**Files to Create**:
- `docs/api/openapi.yaml`
- `docs/api/auth-endpoints.md`

**What to Document**:
- All auth endpoints (register, login, logout, refresh)
- Email verification endpoints
- Password reset endpoints
- Session management endpoints
- RBAC requirements
- Rate limits
- Error codes

**Tools**:
- Swagger UI for interactive docs
- Redoc for static docs

---

### Day 18: Audit Trail Enhancements

**Task**: Enhance audit logging

**Files to Modify**:
- `packages/db/src/schema/auth.ts` (audit_logs table)
- `apps/api-server/src/modules/auth/audit.service.ts`

**What to Add**:
```sql
-- Add columns to audit_logs
ALTER TABLE audit_logs ADD COLUMN changed_by UUID REFERENCES users(id);
ALTER TABLE audit_logs ADD COLUMN old_value TEXT;
ALTER TABLE audit_logs ADD COLUMN new_value TEXT;
ALTER TABLE audit_logs ADD COLUMN brand TEXT;
```

**Actions to Log**:
- Password changes
- Email changes
- Role changes
- 2FA enable/disable
- Session revocations
- Admin actions

---

## 🚀 Deployment Checklist

### Pre-Deployment

- [ ] All Week 1 tasks completed (brand awareness)
- [ ] All Week 2 tasks completed (Identity Bridge & migration)
- [ ] All Week 3 tasks completed (testing & docs)
- [ ] Migration scripts tested on staging
- [ ] Security tests passed
- [ ] API documentation published
- [ ] Team training completed

### Deployment Steps

1. **Staging Deployment**
   - Deploy Identity Bridge service
   - Run migration scripts on staging data
   - Validate migration results
   - Test all auth flows
   - Test cross-brand isolation

2. **Production Deployment**
   - Schedule maintenance window
   - Backup all databases
   - Deploy Identity Bridge service
   - Run migration scripts
   - Validate migration results
   - Monitor health checks
   - Test critical flows
   - Rollback if issues

3. **Post-Deployment**
   - Monitor error rates
   - Monitor login success rates
   - Monitor Identity Bridge latency
   - Check audit logs
   - Verify no cross-brand access
   - User acceptance testing

---

## 📊 Progress Tracking

### Week 1 Progress

- [ ] Day 1-2: Email Templates
- [ ] Day 3: Email Verification Brand Awareness
- [ ] Day 4: Password Reset Brand Awareness
- [ ] Day 5: RBAC Brand Isolation
- [ ] Day 6: Account Lockout Brand Tracking
- [ ] Day 7: Session Management Endpoints

### Week 2 Progress

- [ ] Day 8-10: Identity Bridge Implementation
- [ ] Day 11-12: Data Migration Scripts
- [ ] Day 13-14: Multi-Brand Health Checks

### Week 3 Progress

- [ ] Day 15-16: Security Testing
- [ ] Day 17: API Documentation
- [ ] Day 18: Audit Trail Enhancements

---

## 🎯 Success Criteria

### Functional Requirements

- ✅ RTH users can register/login on user.realtutorialhub.com
- ✅ SkillUp users can register/login on user.skillupitacademy.com
- ✅ Both brands can access shared services on skillhubcore.in
- ✅ Shadow users created in people_prod for all brand users
- ✅ Cross-brand admin access prevented
- ✅ Email verification works per brand
- ✅ Password reset works per brand
- ✅ Account lockout works per brand
- ✅ Session management works per brand

### Non-Functional Requirements

- ✅ All existing users migrated successfully
- ✅ No data loss during migration
- ✅ Login latency < 500ms (p95)
- ✅ Identity Bridge latency < 100ms (p95)
- ✅ Security tests passed (OWASP Top 10)
- ✅ API documentation complete
- ✅ Health checks passing
- ✅ Audit logs capturing all actions

---

## 📞 Support & Resources

### Key Files Reference

**Email Service**:
- `apps/api-server/src/modules/email/EmailService.ts`
- `apps/api-server/src/modules/email/providers/ResendEmailProvider.ts`

**Auth Services**:
- `apps/api-server/src/modules/auth/signup.service.ts`
- `apps/api-server/src/modules/auth/password-recovery.service.ts`
- `apps/api-server/src/modules/auth/security.service.ts`

**RBAC**:
- `services/skillhubcore-service/src/middleware/verify-jwt.ts`

**Session Management**:
- `services/skillhubcore-service/src/modules/user/user.repository.ts`
- `services/skillhubcore-service/src/modules/auth/auth.routes.ts`

**Health Checks**:
- `apps/api-server/src/modules/core/health.service.ts`

**Database Schemas**:
- `packages/db/src/schema/auth.ts`
- `packages/db-people/src/schema/users.ts`

### Documentation

- Architecture: `.kiro/specs/multi-brand-auth-architecture/design.md`
- Gap Analysis: `.kiro/specs/multi-brand-auth-architecture/GAP_ANALYSIS.md`
- Existing Services: `.kiro/specs/multi-brand-auth-architecture/EXISTING_SERVICES_VERIFIED.md`
- Tasks: `.kiro/specs/multi-brand-auth-architecture/tasks.md`

---

## ✅ Conclusion

**Timeline**: 2-3 weeks

**Confidence**: High (most services already exist)

**Risk**: Low (incremental changes to existing services)

**Next Step**: Start Week 1 Day 1 - Email Templates

Good luck! 🚀
