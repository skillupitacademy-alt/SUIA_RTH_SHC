# AI Prompts to Complete Pending Tasks

**Date**: April 2, 2026  
**Purpose**: Step-by-step AI prompts to complete all pending tasks  
**Estimated Time**: 24-35 hours (3-5 days)

> Current note: this file is now partially historical.
> For the live execution status and what is still actually open, use [DEPLOYMENT_STATUS_MATRIX.md](d:/onlinewebsites/quiz-platform/.kiro/DEPLOYMENT_STATUS_MATRIX.md).
> Prompt 1 is obsolete because the Cloudflare token is valid, the active zones are now on SSL `strict`, and the stale wildcard worker route has already been removed.

---

## 🎯 HOW TO USE THIS FILE

1. Copy each prompt in sequence
2. Paste to your AI model
3. Wait for completion
4. Move to next prompt
5. Follow the reference files mentioned in each prompt

---

## PROMPT 1: Fix Cloudflare Token (Do This First)

```
I need to fix the Cloudflare API token. The current token in .env.local is invalid.

CONTEXT:
- Current token returns error: "No route for that URI" (code 10404)
- Token variable: CLOUDFLARE_API_TOKEN

TASK:
1. Guide me to generate a new Cloudflare API token with these permissions:
   - Zone:DNS:Edit
   - Zone:Zone:Read
   - Account:Workers Scripts:Edit
   - Account:R2:Read

2. After I provide the new token, update it in .env.local

3. Test the new token by running:
   curl -X GET "https://api.cloudflare.com/client/v4/user/tokens/verify" -H "Authorization: Bearer NEW_TOKEN"

REFERENCE FILES:
- .env.local (line with CLOUDFLARE_API_TOKEN)
- .kiro/VENDOR_VERIFICATION_SUMMARY.md (Cloudflare section)
```

**Estimated Time**: 1 hour

---

## PROMPT 2: Add Missing Environment Variables

```
Add the following 16 missing environment variables to .env.local file.

CONTEXT:
- Current .env.local has 77 variables
- Need to add 16 more for multi-brand architecture

TASK:
Add these variables to .env.local (append at the end):

# JWT Secret for SkillHub cross-domain tokens
JWT_SKILLHUB_SECRET="[generate a 64-character hex string]"

# Brand-specific email addresses
EMAIL_FROM_RTH="Real Tutorial Hub <noreply@mail.realtutorialhub.com>"
EMAIL_FROM_SKILLUP="SkillUp IT Academy <noreply@skillupitacademy.com>"

# Cookie domains
COOKIE_DOMAIN_RTH=".realtutorialhub.com"
COOKIE_DOMAIN_SKILLUP=".skillupitacademy.com"
COOKIE_DOMAIN_SKILLHUB=".skillhubcore.in"

# Service URLs - SkillUp
NEXT_PUBLIC_API_URL_SKILLUP="https://api.skillupitacademy.com/api"
NEXT_PUBLIC_USER_URL_SKILLUP="https://user.skillupitacademy.com"

# Service URLs - RTH
NEXT_PUBLIC_USER_URL_RTH="https://user.realtutorialhub.com"

# Service URLs - SkillHub
SKILLHUB_API_URL="https://api.skillhubcore.in"
SKILLHUB_QUIZ_URL="https://quiz.skillhubcore.in"
SKILLHUB_TUTORIAL_URL="https://tutorial.skillhubcore.in"
SKILLHUB_PLACEMENT_URL="https://placement.skillhubcore.in"

# OpenTelemetry
OTEL_EXPORTER_OTLP_ENDPOINT="https://cloudtrace.googleapis.com/v2/projects/project-48af6a2d-e8bb-46dd-a58/traces"
OTEL_SERVICE_NAME="multi-brand-auth"
GCP_PROJECT_ID="project-48af6a2d-e8bb-46dd-a58"

REFERENCE FILES:
- .env.local
- .kiro/INFRASTRUCTURE_VERIFICATION_REPORT.md (section: Missing Environment Variables)
```

**Estimated Time**: 30 minutes

---

## PROMPT 3: Week 1 Day 1-2 - Email Templates (Brand-Specific)

```
Implement brand-specific email templates for RTH and SkillUp.

CONTEXT:
- Current EmailService uses only RTH branding
- Need to support both RTH and SkillUp with different colors, logos, and messaging
- RTH: #FF4B91 (pink), AI tutor theme
- SkillUp: #0EA5E9 (blue), physical faculty theme

TASK:
Modify apps/api-server/src/modules/email/EmailService.ts to:

1. Add brand parameter to all email methods:
   - sendWelcomeEmail(email, name, brand)
   - sendEmailVerification(email, token, brand)
   - sendPasswordReset(email, token, brand)
   - sendAccountLockout(email, brand)

2. Create brand-specific email templates:
   - RTH templates: Use #FF4B91 color, "Real Tutorial Hub" branding, AI tutor messaging
   - SkillUp templates: Use #0EA5E9 color, "SkillUp IT Academy" branding, faculty messaging

3. Use brand-specific from addresses:
   - RTH: "Real Tutorial Hub <noreply@mail.realtutorialhub.com>"
   - SkillUp: "SkillUp IT Academy <noreply@skillupitacademy.com>"

4. Update all callers to pass brand parameter

REFERENCE FILES:
- apps/api-server/src/modules/email/EmailService.ts (main file to modify)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 1: Day 1-2)
- .kiro/specs/multi-brand-auth-architecture/IMPLEMENTATION_PRIORITY.md (Week 1 Day 1-2)

VERIFICATION:
After implementation, test by sending a test email for both brands and verify:
- RTH email has pink branding
- SkillUp email has blue branding
- From addresses are correct
```

**Estimated Time**: 4-6 hours

---

## PROMPT 4: Week 1 Day 3 - Email Verification Brand Awareness

```
Add brand parameter to email verification flow.

CONTEXT:
- Email verification currently doesn't track brand
- Need to send brand-specific verification emails and redirect to brand-specific success pages

TASK:
Modify apps/api-server/src/modules/auth/signup.service.ts:

1. Update verifyEmail method signature:
   - Before: async verifyEmail(token: string, ip?: string)
   - After: async verifyEmail(token: string, ip?: string, brand?: 'realtutorialhub' | 'skillup')

2. Update resendVerification method signature:
   - Before: async resendVerification(userId: string, ip?: string)
   - After: async resendVerification(userId: string, ip?: string, brand?: 'realtutorialhub' | 'skillup')

3. Use brand-specific email templates (from Day 1-2)

4. Redirect to brand-specific success pages:
   - RTH: https://user.realtutorialhub.com/verify-success
   - SkillUp: https://user.skillupitacademy.com/verify-success

5. Update route handlers to pass brand parameter

REFERENCE FILES:
- apps/api-server/src/modules/auth/signup.service.ts (main file to modify)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 1: Day 3)
- .kiro/specs/multi-brand-auth-architecture/IMPLEMENTATION_PRIORITY.md (Week 1 Day 3)

VERIFICATION:
Test email verification for both brands and verify correct templates and redirect URLs.
```

**Estimated Time**: 2-3 hours

---

## PROMPT 5: Week 1 Day 4 - Password Reset Brand Awareness

```
Add brand parameter to password reset flow.

CONTEXT:
- Password reset currently doesn't use brand-specific URLs
- Need to send users to correct brand domain for password reset

TASK:
Modify apps/api-server/src/modules/auth/password-recovery.service.ts:

1. Update forgotPassword method signature:
   - Before: async forgotPassword(email: string, ip?: string)
   - After: async forgotPassword(email: string, ip?: string, brand?: 'realtutorialhub' | 'skillup')

2. Update resetPassword method signature:
   - Before: async resetPassword(token: string, newPassword: string, ip?: string)
   - After: async resetPassword(token: string, newPassword: string, ip?: string, brand?: 'realtutorialhub' | 'skillup')

3. Generate brand-specific reset URLs:
   - RTH: https://user.realtutorialhub.com/reset-password?token=xxx
   - SkillUp: https://user.skillupitacademy.com/reset-password?token=xxx

4. Use brand-specific email templates (from Day 1-2)

5. Update route handlers to pass brand parameter

REFERENCE FILES:
- apps/api-server/src/modules/auth/password-recovery.service.ts (main file to modify)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 1: Day 4)
- .kiro/specs/multi-brand-auth-architecture/IMPLEMENTATION_PRIORITY.md (Week 1 Day 4)

VERIFICATION:
Test password reset for both brands and verify correct reset URLs and email templates.
```

**Estimated Time**: 2-3 hours

---

## PROMPT 6: Week 1 Day 5 - RBAC Brand Isolation

```
Add brand isolation to RBAC middleware to prevent cross-brand access.

CONTEXT:
- Current RBAC doesn't prevent RTH admin from accessing SkillUp routes
- Need to add requirePlatform() middleware for brand-specific routes

TASK:
Modify services/skillhubcore-service/src/middleware/verify-jwt.ts:

1. Add requirePlatform() middleware function:
   export const requirePlatform = (allowedBrand: 'realtutorialhub' | 'skillup') => {
     return createMiddleware(async (c, next) => {
       const user = c.get('authUser');
       
       if (user.brand !== allowedBrand) {
         return c.json({ error: 'Cross-brand access denied' }, 403);
       }
       
       await next();
     });
   };

2. Apply to brand-specific routes (examples):
   - RTH-only routes: app.use('/rth/*', requireAuth, requirePlatform('realtutorialhub'))
   - SkillUp-only routes: app.use('/skillup/*', requireAuth, requirePlatform('skillup'))

3. Allow SUPER_ADMIN cross-brand access (optional)

REFERENCE FILES:
- services/skillhubcore-service/src/middleware/verify-jwt.ts (main file to modify)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 1: Day 5)
- .kiro/specs/multi-brand-auth-architecture/IMPLEMENTATION_PRIORITY.md (Week 1 Day 5)

VERIFICATION:
Test that RTH admin cannot access SkillUp routes and vice versa.
```

**Estimated Time**: 2-3 hours

---

## PROMPT 7: Week 1 Day 6 - Account Lockout Brand Tracking

```
Add brand tracking to account lockout to prevent cross-brand lockout.

CONTEXT:
- Current lockout system doesn't track brand
- RTH lockout should not affect SkillUp login and vice versa

TASK:
Modify apps/api-server/src/modules/auth/security.service.ts:

1. Update trackLoginAttempt method signature:
   - Before: async trackLoginAttempt(ip: string, email: string, success: boolean)
   - After: async trackLoginAttempt(ip: string, email: string, success: boolean, brand?: 'realtutorialhub' | 'skillup')

2. Update isAccountLocked method signature:
   - Before: async isAccountLocked(email: string, ip: string): Promise<boolean>
   - After: async isAccountLocked(email: string, ip: string, brand?: 'realtutorialhub' | 'skillup'): Promise<boolean>

3. Filter lockout queries by brand:
   - Check login_attempts WHERE brand = ? AND email = ? AND ip = ?

4. Send brand-specific lockout notification emails

5. Update all callers (login routes) to pass brand parameter

REFERENCE FILES:
- apps/api-server/src/modules/auth/security.service.ts (main file to modify)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 1: Day 6)
- .kiro/specs/multi-brand-auth-architecture/IMPLEMENTATION_PRIORITY.md (Week 1 Day 6)

VERIFICATION:
Test that locking RTH account doesn't lock SkillUp account with same email.
```

**Estimated Time**: 2-3 hours

---

## PROMPT 8: Week 1 Day 7 - Session Management Endpoints

```
Add brand-specific session management endpoints.

CONTEXT:
- Users need to view and revoke their active sessions
- Sessions should be filtered by brand

TASK:
Modify services/skillhubcore-service/src/modules/auth/auth.routes.ts:

1. Add GET /auth/sessions endpoint:
   - Extract user from authUser context
   - Call authService.getUserSessions(user.id, user.brand)
   - Return list of active sessions

2. Add DELETE /auth/sessions/:id endpoint:
   - Extract user and sessionId
   - Call authService.revokeSession(user.id, sessionId, user.brand)
   - Return success response

3. Add DELETE /auth/sessions endpoint (revoke all):
   - Extract user from authUser context
   - Call authService.revokeAllSessions(user.id, user.brand)
   - Return success response

4. Implement the service methods in auth service

5. Filter sessions by brand to prevent cross-brand session access

REFERENCE FILES:
- services/skillhubcore-service/src/modules/auth/auth.routes.ts (main file to modify)
- services/skillhubcore-service/src/modules/user/user.repository.ts (may need session methods)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 1: Day 7)
- .kiro/specs/multi-brand-auth-architecture/IMPLEMENTATION_PRIORITY.md (Week 1 Day 7)

VERIFICATION:
Test that users can list and revoke their sessions, and cannot access other brand's sessions.
```

**Estimated Time**: 3-4 hours

---

## PROMPT 9: Week 2 - Wire Identity Bridge to Signup Flow

```
Wire the Identity Bridge service to the signup flow so every new user automatically gets a shadow user in people_prod.

CONTEXT:
- Identity Bridge package exists at packages/identity-bridge
- Currently NOT wired to signup flow
- Every new signup should create shadow user automatically

TASK:
Modify apps/api-server/src/modules/auth/signup.service.ts:

1. Import UserIdentityBridgeService from packages/identity-bridge

2. In the register/signup method, after creating user in brand database:
   - Call identityBridge.syncUser(brandUser, brand)
   - Store returned shadowUserId in brand user record
   - Grant platform access
   - Make this non-blocking (don't fail signup if bridge fails)

3. Add error handling:
   - Log bridge failures but don't block signup
   - Queue retry if bridge fails

4. Add structured logging for bridge operations

REFERENCE FILES:
- apps/api-server/src/modules/auth/signup.service.ts (main file to modify)
- packages/identity-bridge/src/UserIdentityBridgeService.ts (service to use)
- .kiro/specs/multi-brand-auth-architecture/tasks.md (Task 4: Identity Bridge)
- .kiro/VENDOR_VERIFICATION_SUMMARY.md (shows 13 users already linked)

VERIFICATION:
Create a new test user and verify:
1. User created in rth_prod or skillup_prod
2. Shadow user created in people_prod with external_id and external_brand
3. platform_access record created
4. shadow_user_id set in brand user record
```

**Estimated Time**: 2-3 hours

---

## PROMPT 10: Verify Cloudflare DNS Records

```
Verify that all required DNS records exist in Cloudflare for the multi-brand architecture.

CONTEXT:
- Need DNS records for 12 hostnames across 3 domains
- Cloudflare token should be fixed by now

TASK:
1. List all DNS records in Cloudflare for these zones:
   - realtutorialhub.com
   - skillupitacademy.com
   - skillhubcore.in

2. Verify these records exist:

RTH Domain (realtutorialhub.com):
- user.realtutorialhub.com → Cloud Run
- admin.realtutorialhub.com → Cloud Run
- api.realtutorialhub.com → Cloudflare Worker

SkillUp Domain (skillupitacademy.com):
- user.skillupitacademy.com → Cloud Run
- admin.skillupitacademy.com → Cloud Run
- faculty.skillupitacademy.com → Cloud Run
- api.skillupitacademy.com → Cloudflare Worker

SkillHub Domain (skillhubcore.in):
- quiz.skillhubcore.in → Cloud Run
- tutorial.skillhubcore.in → Cloud Run
- placement.skillhubcore.in → Cloud Run
- admin.skillhubcore.in → Cloud Run
- api.skillhubcore.in → Cloudflare Worker

3. Create any missing DNS records

4. Verify SSL/TLS is set to "Full (strict)"

REFERENCE FILES:
- .kiro/DEPLOYMENT_STATUS_MATRIX.md (section: Cloudflare DNS configuration)
- .kiro/APPROVED_DEPLOYMENT_PLAN.md (section: Verify Cloudflare DNS)
- services/api-gateway/wrangler.toml (shows required routes)

VERIFICATION:
Test DNS resolution: nslookup user.realtutorialhub.com
```

**Estimated Time**: 1 hour

---

## PROMPT 11: Deploy All Services to Production

```
Deploy all 9 Cloud Run services and the Cloudflare Worker gateway to production.

CONTEXT:
- All Dockerfiles exist
- GitHub workflows are ready
- GCP Cloud Run is configured
- Cloudflare Worker is configured

TASK:
1. Trigger GitHub workflow manually or push to main branch

2. Monitor deployment progress:
   - Check GitHub Actions for deploy-cloudrun.yml
   - Check GitHub Actions for deploy-gateway.yml

3. Verify all services deployed successfully:
   - quiz-api-server
   - quiz-web-app
   - quiz-admin-app
   - realtutorialhub-web
   - skillup-web
   - skillup-admin
   - faculty-app
   - skillhubcore-admin
   - skillhubcore-service

4. Verify Cloudflare Worker deployed:
   - platform-api-gateway

5. Run health checks on all services

REFERENCE FILES:
- .github/workflows/deploy-cloudrun.yml (deployment workflow)
- .github/workflows/deploy-gateway.yml (gateway workflow)
- .kiro/DEPLOYMENT_STATUS_MATRIX.md (complete deployment guide)
- .kiro/APPROVED_DEPLOYMENT_PLAN.md (execution plan)

VERIFICATION:
Run health checks:
- curl https://api.realtutorialhub.com/api/health/live
- curl https://user.realtutorialhub.com/
- curl https://user.skillupitacademy.com/
- curl https://quiz.skillhubcore.in/
```

**Estimated Time**: 2-3 hours

---

## PROMPT 12: Test End-to-End Authentication Flow

```
Test the complete authentication flow for both brands to verify everything works.

CONTEXT:
- All services should be deployed
- DNS should be configured
- Need to verify authentication works end-to-end

TASK:
Test these flows:

1. RTH User Flow:
   - Go to https://user.realtutorialhub.com/login
   - Register new user
   - Verify email received with RTH branding
   - Click verification link
   - Login with credentials
   - Verify cookie set for .realtutorialhub.com
   - Verify JWT token has brand='realtutorialhub'
   - Verify shadow user created in people_prod

2. SkillUp User Flow:
   - Go to https://user.skillupitacademy.com/login
   - Register new user
   - Verify email received with SkillUp branding
   - Click verification link
   - Login with credentials
   - Verify cookie set for .skillupitacademy.com
   - Verify JWT token has brand='skillup'
   - Verify shadow user created in people_prod

3. Cross-Brand Isolation:
   - Verify RTH cookies don't work on SkillUp domains
   - Verify SkillUp cookies don't work on RTH domains
   - Verify RTH admin cannot access SkillUp admin routes

REFERENCE FILES:
- .kiro/specs/multi-brand-auth-architecture/design.md (authentication flows)
- .kiro/DEPLOYMENT_STATUS_MATRIX.md (section: Final Go-Live Gate)

VERIFICATION:
All tests should pass. Document any failures.
```

**Estimated Time**: 2-3 hours

---

## 📚 REFERENCE FILES IN SEQUENCE

### Phase 0: Pre-Deployment (Prompts 1-2)
1. `.kiro/VENDOR_VERIFICATION_SUMMARY.md` - Understand what exists
2. `.kiro/INFRASTRUCTURE_VERIFICATION_REPORT.md` - See gaps
3. `.env.local` - Add missing variables

### Phase 1: Week 1 Implementation (Prompts 3-8)
1. `.kiro/specs/multi-brand-auth-architecture/IMPLEMENTATION_PRIORITY.md` - Week-by-week guide
2. `.kiro/specs/multi-brand-auth-architecture/tasks.md` - Detailed task list
3. `.kiro/specs/multi-brand-auth-architecture/design.md` - Architecture reference

### Phase 2: Deployment (Prompts 10-11)
1. `.kiro/DEPLOYMENT_STATUS_MATRIX.md` - Complete deployment guide
2. `.kiro/APPROVED_DEPLOYMENT_PLAN.md` - Execution plan
3. `.github/workflows/deploy-cloudrun.yml` - Workflow reference
4. `.github/workflows/deploy-gateway.yml` - Gateway workflow

### Phase 3: Verification (Prompt 12)
1. `.kiro/DEPLOYMENT_CHECKLIST_REVIEW.md` - Verification checklist
2. `.kiro/specs/multi-brand-auth-architecture/design.md` - Expected behavior

---

## ⏱️ TIME ESTIMATES

| Prompt | Task | Time |
|--------|------|------|
| 1 | Fix Cloudflare token | 1 hour |
| 2 | Add env vars | 30 minutes |
| 3 | Email templates | 4-6 hours |
| 4 | Email verification | 2-3 hours |
| 5 | Password reset | 2-3 hours |
| 6 | RBAC isolation | 2-3 hours |
| 7 | Account lockout | 2-3 hours |
| 8 | Session management | 3-4 hours |
| 9 | Wire Identity Bridge | 2-3 hours |
| 10 | Verify DNS | 1 hour |
| 11 | Deploy services | 2-3 hours |
| 12 | E2E testing | 2-3 hours |
| **TOTAL** | **All tasks** | **24-35 hours** |

---

## 🚀 EXECUTION SEQUENCE

### Week 1: Pre-Deployment + Brand Awareness
```
Day 1: Prompts 1-2 (Fix infrastructure)
Day 2-3: Prompt 3 (Email templates)
Day 4: Prompt 4 (Email verification)
Day 5: Prompt 5 (Password reset)
Day 6: Prompt 6 (RBAC isolation)
Day 7: Prompt 7 (Account lockout)
```

### Week 2: Identity Bridge + Deployment
```
Day 8: Prompt 8 (Session management)
Day 9: Prompt 9 (Wire Identity Bridge)
Day 10: Prompt 10 (Verify DNS)
Day 11: Prompt 11 (Deploy all services)
Day 12: Prompt 12 (E2E testing)
```

---

## 📋 COMPLETION CHECKLIST

Track your progress:

- [ ] Prompt 1: Cloudflare token fixed
- [ ] Prompt 2: Environment variables added
- [ ] Prompt 3: Email templates implemented
- [ ] Prompt 4: Email verification brand-aware
- [ ] Prompt 5: Password reset brand-aware
- [ ] Prompt 6: RBAC brand isolation added
- [ ] Prompt 7: Account lockout brand tracking
- [ ] Prompt 8: Session management endpoints
- [ ] Prompt 9: Identity Bridge wired to signup
- [ ] Prompt 10: DNS records verified
- [ ] Prompt 11: All services deployed
- [ ] Prompt 12: E2E tests passed

---

## ✅ SUCCESS CRITERIA

After completing all prompts, you should have:

1. ✅ All infrastructure configured (Cloudflare, env vars)
2. ✅ Brand-specific email templates working
3. ✅ Brand-specific password reset working
4. ✅ RBAC brand isolation enforced
5. ✅ Account lockout per brand
6. ✅ Session management per brand
7. ✅ Identity Bridge auto-syncing new users
8. ✅ All services deployed to production
9. ✅ DNS records configured
10. ✅ E2E authentication working for both brands

---

## 🎯 FINAL NOTE

**This file contains everything you need** to complete all pending tasks.

**No other files needed** - just follow the prompts in sequence.

**Each prompt is self-contained** with context, tasks, reference files, and verification steps.

**Start with Prompt 1** and work your way through.

Good luck! 🚀
