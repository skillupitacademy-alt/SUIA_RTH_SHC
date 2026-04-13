# 🎯 AUTHENTICATION IMPLEMENTATION ACTION PLAN
## Detailed Task Breakdown - April 13, 2026

> **Current Phase**: 3.5 (Backend Auth → Gateway Layer)  
> **Target Phase**: 10 (Full Request Flow)  
> **Timeline**: 12-16 weeks  
> **Priority**: HIGH

---

## 📋 PHASE 4: GATEWAY INTEGRATION (2-3 weeks)

### **Goal**: All API requests go through the gateway

### **Tasks**

#### **Task 4.1: Complete Gateway Routing Table** (2 days)

**File**: `services/api-gateway/src/routes/routing-table.ts`

**Current**:
```typescript
export const ROUTING_TABLE = [
  { host: 'app.skillupitacademy.com', prefix: '/', upstreamKey: 'SKILLUP_WEB_URL' },
  { host: 'admin.skillupitacademy.com', prefix: '/', upstreamKey: 'SKILLUP_ADMIN_URL' },
  { host: 'faculty.skillupitacademy.com', prefix: '/', upstreamKey: 'FACULTY_URL' },
  { host: 'api.skillhubcore.in', prefix: '/', upstreamKey: 'SKILLHUBCORE_URL' },
];
```

**Add**:
```typescript
export const ROUTING_TABLE = [
  // Auth (SkillHubCore)
  { host: 'api.realtutorialhub.com', prefix: '/auth', upstream: 'SKILLHUBCORE_URL', public: true },
  { host: 'api.skillupitacademy.com', prefix: '/auth', upstream: 'SKILLHUBCORE_URL', public: true },
  
  // Exam Engine
  { host: 'api.realtutorialhub.com', prefix: '/exam', upstream: 'EXAM_SERVICE_URL', auth: true },
  { host: 'api.realtutorialhub.com', prefix: '/questions', upstream: 'EXAM_SERVICE_URL', auth: true },
  
  // Tutorial Engine
  { host: 'api.realtutorialhub.com', prefix: '/tutorial', upstream: 'TUTORIAL_SERVICE_URL', auth: true },
  { host: 'api.realtutorialhub.com', prefix: '/ai-tutor', upstream: 'TUTORIAL_SERVICE_URL', auth: true },
  
  // Student & Faculty (People)
  { host: 'api.skillupitacademy.com', prefix: '/students', upstream: 'STUDENT_FACULTY_URL', auth: true },
  { host: 'api.skillupitacademy.com', prefix: '/faculty', upstream: 'STUDENT_FACULTY_URL', auth: true },
  { host: 'api.skillupitacademy.com', prefix: '/batches', upstream: 'STUDENT_FACULTY_URL', auth: true },
  
  // Payment
  { host: 'api.realtutorialhub.com', prefix: '/payments', upstream: 'PAYMENT_SERVICE_URL', auth: true },
  { host: 'api.realtutorialhub.com', prefix: '/webhooks', upstream: 'PAYMENT_SERVICE_URL', public: true },
  
  // Admin
  { host: 'api.realtutorialhub.com', prefix: '/admin', upstream: 'ADMIN_URL', auth: true, requireRole: 'admin' },
  
  // Existing routes
  { host: 'app.skillupitacademy.com', prefix: '/', upstreamKey: 'SKILLUP_WEB_URL' },
  { host: 'admin.skillupitacademy.com', prefix: '/', upstreamKey: 'SKILLUP_ADMIN_URL' },
  { host: 'faculty.skillupitacademy.com', prefix: '/', upstreamKey: 'FACULTY_URL' },
  { host: 'api.skillhubcore.in', prefix: '/', upstreamKey: 'SKILLHUBCORE_URL' },
];
```

**Acceptance Criteria**:
- [ ] All service routes defined
- [ ] Auth routes marked as `public: true`
- [ ] Protected routes marked as `auth: true`
- [ ] Admin routes have `requireRole: 'admin'`

---

#### **Task 4.2: Add Gateway Secret Verification to All Services** (3 days)

**Services to Update**:
1. `services/skillhubcore-service` ✅ (already has it)
2. `apps/api-server` ❌ (needs it)

**File**: `apps/api-server/src/middleware/verify-gateway-secret.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server';

export function verifyGatewaySecret(request: NextRequest): NextResponse | null {
  const gatewaySecret = request.headers.get('x-gateway-secret');
  const expectedSecret = process.env.INTERNAL_GATEWAY_SECRET;

  if (!expectedSecret) {
    console.error('[GATEWAY_SECRET] INTERNAL_GATEWAY_SECRET not configured');
    return NextResponse.json(
      { error: 'Gateway secret not configured' },
      { status: 500 }
    );
  }

  if (gatewaySecret !== expectedSecret) {
    console.warn('[GATEWAY_SECRET] Invalid gateway secret');
    return NextResponse.json(
      { error: 'Forbidden: Invalid gateway secret' },
      { status: 403 }
    );
  }

  return null; // Valid
}
```

**Update**: `apps/api-server/src/proxy.ts`

```typescript
// Add after line 20
const gatewaySecretError = verifyGatewaySecret(request);
if (gatewaySecretError !== null) {
  return gatewaySecretError;
}
```

**Acceptance Criteria**:
- [ ] Gateway secret verification added to api-server
- [ ] All services verify `x-gateway-secret` header
- [ ] Requests without valid secret are rejected (403)
- [ ] Environment variable `INTERNAL_GATEWAY_SECRET` set

---

#### **Task 4.3: Update Frontend API Calls to Use Gateway** (5 days)

**Files to Update**:

1. **`packages/api-client/src/core/fetch-client.ts`**
   - Update `baseUrl` to point to gateway
   - Ensure `credentials: 'include'` for cookies

2. **All BFF routes** (apps/*/src/app/api/*)
   - Update upstream URLs to gateway
   - Add `x-gateway-secret` header

**Example**:

**BEFORE**:
```typescript
// apps/realtutorialhub-web/src/lib/tutorial-content-api.ts
const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/tutorial/content/${id}`);
```

**AFTER**:
```typescript
// apps/realtutorialhub-web/src/lib/tutorial-content-api.ts
const response = await fetch(`${process.env.NEXT_PUBLIC_GATEWAY_URL}/tutorial/content/${id}`, {
  headers: {
    'x-gateway-secret': process.env.INTERNAL_GATEWAY_SECRET!,
  },
});
```

**Acceptance Criteria**:
- [ ] All API calls go through gateway
- [ ] No direct service-to-service calls
- [ ] Gateway URL configured in environment
- [ ] All requests include gateway secret

---

#### **Task 4.4: Test Gateway End-to-End** (2 days)

**Test Cases**:

1. **Auth Flow**
   - [ ] Login through gateway works
   - [ ] Token verification at gateway works
   - [ ] Identity headers set correctly

2. **Protected Routes**
   - [ ] Authenticated requests pass through
   - [ ] Unauthenticated requests rejected (401)
   - [ ] Admin routes require admin role

3. **Rate Limiting**
   - [ ] Rate limit enforced (100 req/min)
   - [ ] 429 response when limit exceeded
   - [ ] Rate limit headers present

4. **Request ID**
   - [ ] Request ID generated at gateway
   - [ ] Request ID propagated to services
   - [ ] Request ID in response headers

5. **CORS**
   - [ ] CORS headers present
   - [ ] Preflight requests handled
   - [ ] Credentials allowed

**Acceptance Criteria**:
- [ ] All test cases pass
- [ ] No direct service calls
- [ ] Gateway logs show all requests
- [ ] Performance acceptable (<50ms overhead)

---

## 📋 PHASE 6: AUTH SERVICE EXTRACTION (3-4 weeks)

### **Goal**: All auth operations handled by SkillHubCore

### **Tasks**

#### **Task 6.1: Move Login Route to SkillHubCore** (3 days)

**Current**: `apps/api-server/src/app/api/auth/login/route.ts`

**Move to**: `services/skillhubcore-service/src/modules/auth/auth.routes.ts`

**Steps**:
1. Copy login logic from api-server to SkillHubCore
2. Update to use SkillHubCore's AuthService
3. Test login through SkillHubCore
4. Update frontend to call SkillHubCore
5. Remove login route from api-server

**Acceptance Criteria**:
- [ ] Login works through SkillHubCore
- [ ] Tokens generated by SkillHubCore
- [ ] Cookies set correctly
- [ ] Frontend updated
- [ ] api-server login route removed

---

#### **Task 6.2: Move Register Route to SkillHubCore** (3 days)

**Current**: `apps/api-server/src/app/api/auth/register/route.ts`

**Move to**: `services/skillhubcore-service/src/modules/auth/auth.routes.ts`

**Steps**:
1. Copy register logic from api-server to SkillHubCore
2. Update to use SkillHubCore's AuthService
3. Test registration through SkillHubCore
4. Update frontend to call SkillHubCore
5. Remove register route from api-server

**Acceptance Criteria**:
- [ ] Registration works through SkillHubCore
- [ ] User created in people_prod database
- [ ] Tokens generated
- [ ] Welcome email sent
- [ ] api-server register route removed

---

#### **Task 6.3: Move Token Refresh to SkillHubCore** (2 days)

**Current**: `apps/api-server/src/app/api/auth/refresh/route.ts`

**Move to**: `services/skillhubcore-service/src/modules/auth/auth.routes.ts`

**Steps**:
1. Copy refresh logic from api-server to SkillHubCore
2. Update to use TokenRotationService
3. Test token refresh through SkillHubCore
4. Update frontend to call SkillHubCore
5. Remove refresh route from api-server

**Acceptance Criteria**:
- [ ] Token refresh works through SkillHubCore
- [ ] Old tokens invalidated
- [ ] New tokens generated
- [ ] Token family tracked
- [ ] api-server refresh route removed

---

#### **Task 6.4: Move /auth/me to SkillHubCore** (2 days)

**Current**: `apps/api-server/src/app/api/auth/me/route.ts`

**Move to**: `services/skillhubcore-service/src/modules/auth/auth.routes.ts`

**Steps**:
1. Copy /auth/me logic from api-server to SkillHubCore
2. Update to use SkillHubCore's UserRepository
3. Test session restoration through SkillHubCore
4. Update frontend to call SkillHubCore
5. Remove /auth/me route from api-server

**Acceptance Criteria**:
- [ ] Session restoration works
- [ ] User data returned correctly
- [ ] Token expiration included
- [ ] Frontend updated
- [ ] api-server /auth/me route removed

---

#### **Task 6.5: Remove Auth Logic from api-server** (3 days)

**Files to Remove/Update**:
1. `apps/api-server/src/app/api/auth/*` - Remove all auth routes
2. `apps/api-server/src/modules/auth/auth.service.ts` - Remove
3. `apps/api-server/src/modules/auth/token.service.ts` - Keep re-export only

**Keep**:
- `apps/api-server/src/modules/auth/token.service.ts` (re-export from @quiz/auth)
- `apps/api-server/src/modules/auth/rbac.service.ts` (authorization logic)
- `apps/api-server/src/modules/auth/cors.middleware.ts`
- `apps/api-server/src/modules/auth/csrf.middleware.ts`

**Acceptance Criteria**:
- [ ] All auth routes removed from api-server
- [ ] Auth service removed
- [ ] TokenService re-export remains
- [ ] RBAC service remains
- [ ] All tests pass

---

#### **Task 6.6: Update All Apps to Use SkillHubCore for Auth** (5 days)

**Apps to Update**:
1. `realtutorialhub-web`
2. `realtutorialhub-quiz`
3. `realtutorialhub-admin`
4. `skillup-web`
5. `skillup-admin`
6. `faculty-app`
7. `skillhub-placement`
8. `skillhubcore-admin`

**Changes**:
- Update login endpoint: `${GATEWAY_URL}/auth/login`
- Update register endpoint: `${GATEWAY_URL}/auth/register`
- Update refresh endpoint: `${GATEWAY_URL}/auth/refresh`
- Update /auth/me endpoint: `${GATEWAY_URL}/auth/me`

**Acceptance Criteria**:
- [ ] All apps use SkillHubCore for auth
- [ ] Login works in all apps
- [ ] Registration works in all apps
- [ ] Token refresh works in all apps
- [ ] Session restoration works in all apps

---

## 📋 PHASE 7: MULTI-BRAND SSO (2-3 weeks)

### **Goal**: Single login works across all platforms

### **Tasks**

#### **Task 7.1: Implement SSO Login Flow** (5 days)

**File**: `services/skillhubcore-service/src/modules/auth/sso/sso.service.ts`

**Current**:
```typescript
// Basic SSO structure exists
```

**Add**:
```typescript
async loginWithSSO(email: string, password: string): Promise<SSOLoginResult> {
  // 1. Verify credentials
  const user = await this.userRepo.findByEmail(email);
  if (!user) throw new Error('Invalid credentials');
  
  const isValid = await this.passwordService.verify(password, user.passwordHash);
  if (!isValid) throw new Error('Invalid credentials');
  
  // 2. Get all platforms user has access to
  const platforms = await this.userRepo.getUserPlatforms(user.id);
  
  // 3. Get subscriptions
  const subscriptions = await this.subscriptionService.getUserSubscriptions(user.id);
  
  // 4. Generate SSO token with all platforms
  const accessToken = await this.tokenService.signSkillHubCoreAccessToken(
    user.id,
    user.roles,
    subscriptions,
    platforms,
    {
      originalUserId: user.id,
      shadowUserId: user.id,
      brand: platforms[0], // Primary platform
    }
  );
  
  // 5. Generate refresh token
  const familyId = TokenService.generateFamilyId();
  const refreshToken = await this.tokenService.signSkillHubCoreRefreshToken(user.id, familyId);
  
  return {
    accessToken,
    refreshToken,
    user,
    platforms,
    subscriptions,
  };
}
```

**Acceptance Criteria**:
- [ ] SSO login generates token with `platforms` array
- [ ] Token includes all accessible platforms
- [ ] Token includes subscriptions
- [ ] Token includes brand
- [ ] Refresh token generated

---

#### **Task 7.2: Implement Cross-Platform Navigation** (3 days)

**File**: `packages/ui/src/components/PlatformSwitcher.tsx` (NEW)

```typescript
export function PlatformSwitcher() {
  const { user } = useAuth();
  const platforms = user?.platforms ?? [];
  
  return (
    <DropdownMenu>
      <DropdownMenuTrigger>Switch Platform</DropdownMenuTrigger>
      <DropdownMenuContent>
        {platforms.includes('realtutorialhub') && (
          <DropdownMenuItem onClick={() => window.location.href = 'https://realtutorialhub.com'}>
            RealTutorialHub
          </DropdownMenuItem>
        )}
        {platforms.includes('skillup') && (
          <DropdownMenuItem onClick={() => window.location.href = 'https://skillupitacademy.com'}>
            SkillUp IT Academy
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
```

**Acceptance Criteria**:
- [ ] Platform switcher component created
- [ ] Shows only accessible platforms
- [ ] Navigation works
- [ ] Token remains valid across platforms
- [ ] User session persists

---

#### **Task 7.3: Implement Subscription Checks** (3 days)

**File**: `packages/auth/src/subscription.cache.ts` (EXISTS)

**Enhance**:
```typescript
export async function checkSubscriptionAccess(
  userId: string,
  requiredSubscription: string
): Promise<boolean> {
  const subscriptions = await getSubscriptions(userId);
  return subscriptions.includes(requiredSubscription);
}

export async function checkPlatformAccess(
  userId: string,
  requiredPlatform: 'realtutorialhub' | 'skillup'
): Promise<boolean> {
  const platforms = await getPlatforms(userId);
  return platforms.includes(requiredPlatform);
}
```

**Acceptance Criteria**:
- [ ] Subscription checks work
- [ ] Platform access checks work
- [ ] Cached for performance
- [ ] Middleware enforces checks
- [ ] Unauthorized access blocked

---

#### **Task 7.4: Test SSO End-to-End** (2 days)

**Test Cases**:

1. **Single Login**
   - [ ] Login to RTH
   - [ ] Navigate to SkillUp
   - [ ] Session persists
   - [ ] No re-login required

2. **Platform Access**
   - [ ] User with RTH access can access RTH
   - [ ] User without SkillUp access cannot access SkillUp
   - [ ] Platform switcher shows correct platforms

3. **Subscription Access**
   - [ ] Premium features require premium subscription
   - [ ] Free users cannot access premium features
   - [ ] Subscription checks work

**Acceptance Criteria**:
- [ ] All test cases pass
- [ ] SSO works across platforms
- [ ] Subscription checks work
- [ ] Platform access enforced

---

## 📋 PHASE 5: EVENT BUS COMPLETION (2-3 weeks)

### **Goal**: All cross-service communication via events

### **Tasks**

#### **Task 5.1: Define All Event Types** (2 days)

**File**: `packages/events/src/types.ts`

```typescript
export type PlatformEvent =
  // Auth events
  | 'user.registered'
  | 'user.login'
  | 'user.logout'
  | 'user.password_reset'
  
  // Student events
  | 'student.enrolled'
  | 'student.created'
  | 'student.updated'
  
  // Exam events
  | 'exam.started'
  | 'exam.completed'
  | 'exam.scored'
  
  // Tutorial events
  | 'tutorial.subtopic_completed'
  | 'tutorial.assignment_submitted'
  | 'tutorial.progress_updated'
  
  // Payment events
  | 'payment.received'
  | 'payment.failed'
  | 'payment.overdue'
  | 'subscription.created'
  | 'subscription.renewed'
  | 'subscription.cancelled'
  
  // Batch events
  | 'batch.session_completed'
  | 'batch.subtopics_covered'
  | 'attendance.marked'
  
  // Admission events
  | 'admission.completed'
  | 'admission.approved'
  | 'admission.rejected'
  
  // Project events
  | 'project.submitted'
  | 'project.reviewed'
  | 'project.approved'
  
  // Certificate events
  | 'certificate.issued'
  | 'certificate.revoked'
  
  // Placement events
  | 'placement.offer_accepted'
  | 'placement.offer_rejected'
  
  // Content events
  | 'content.generation_requested'
  | 'content.approved_and_published';
```

**Acceptance Criteria**:
- [ ] All event types defined
- [ ] Event payload types defined
- [ ] Event documentation created
- [ ] Event naming conventions followed

---

#### **Task 5.2: Implement Event Publishers** (3 days)

**File**: `packages/events/src/publisher.ts` (EXISTS)

**Enhance**:
```typescript
export async function publishEvent<T>(
  type: PlatformEvent,
  payload: T,
  options?: {
    delay?: number;
    retries?: number;
    callbackUrl?: string;
  }
): Promise<void> {
  const envelope: EventEnvelope<T> = {
    type,
    payload,
    publishedAt: new Date().toISOString(),
    publishedBy: process.env.SERVICE_NAME!,
    correlationId: crypto.randomUUID(),
  };

  const consumers = EVENT_CONSUMER_MAP[type] ?? [];

  await Promise.all(consumers.map(consumerUrl =>
    qstash.publishJSON({
      url: consumerUrl,
      body: envelope,
      retries: options?.retries ?? 3,
      delay: options?.delay,
      ...(options?.callbackUrl ? { callback: options.callbackUrl } : {}),
    })
  ));
}
```

**Acceptance Criteria**:
- [ ] Event publisher works
- [ ] Events routed to correct consumers
- [ ] Retry logic works
- [ ] Callback support works

---

#### **Task 5.3: Implement Event Consumers** (5 days)

**Services to Update**:
1. `services/skillhubcore-service` - Auth events
2. `apps/api-server` - Exam/tutorial events
3. Future services - Other events

**Example**: `services/skillhubcore-service/src/modules/events/consumers/user-registered.consumer.ts`

```typescript
export const handleUserRegistered = createQStashHandler<UserRegisteredPayload>(
  async (envelope) => {
    const { userId, email, platform } = envelope.payload;
    
    // 1. Send welcome email
    await emailService.sendWelcomeEmail(email);
    
    // 2. Create default subscription
    await subscriptionService.createFreeSubscription(userId);
    
    // 3. Log event
    logger.info({ userId, platform }, 'User registered');
  }
);
```

**Acceptance Criteria**:
- [ ] Event consumers implemented
- [ ] Consumers handle all event types
- [ ] Error handling works
- [ ] Retry logic works
- [ ] Dead letter queue works

---

#### **Task 5.4: Remove Direct Service Calls** (3 days)

**Find and Replace**:
- Direct API calls → Event publishing
- Synchronous calls → Asynchronous events

**Example**:

**BEFORE**:
```typescript
// Direct call
await fetch(`${TUTORIAL_SERVICE_URL}/api/remediation`, {
  method: 'POST',
  body: JSON.stringify({ userId, weakSubtopics }),
});
```

**AFTER**:
```typescript
// Event publishing
await publishEvent('exam.completed', {
  userId,
  examResultId,
  weakSubtopicIds,
  scores,
});
```

**Acceptance Criteria**:
- [ ] No direct service-to-service calls
- [ ] All communication via events
- [ ] Services decoupled
- [ ] Event flow documented

---

## 📋 PHASE 8: ABAC IMPLEMENTATION (3-4 weeks)

### **Goal**: Fine-grained authorization based on attributes

### **Tasks**

#### **Task 8.1: Define Permission Attributes** (2 days)

**File**: `packages/auth/src/permissions.ts` (NEW)

```typescript
export type PermissionAttribute = {
  resource: string;
  action: 'read' | 'write' | 'delete' | 'execute';
  conditions?: {
    subscription?: string[];
    platform?: string[];
    role?: string[];
    org?: string;
  };
};

export const PERMISSIONS: Record<string, PermissionAttribute> = {
  'exam:start': {
    resource: 'exam',
    action: 'execute',
    conditions: {
      subscription: ['free', 'premium', 'training'],
      platform: ['realtutorialhub'],
    },
  },
  'tutorial:access': {
    resource: 'tutorial',
    action: 'read',
    conditions: {
      subscription: ['premium', 'training'],
      platform: ['realtutorialhub'],
    },
  },
  'batch:view': {
    resource: 'batch',
    action: 'read',
    conditions: {
      subscription: ['training'],
      platform: ['skillup'],
    },
  },
};
```

**Acceptance Criteria**:
- [ ] All permissions defined
- [ ] Attributes documented
- [ ] Conditions specified
- [ ] Permission naming conventions followed

---

#### **Task 8.2: Implement Permission Checks** (5 days)

**File**: `packages/auth/src/abac.service.ts` (NEW)

```typescript
export class ABACService {
  async checkPermission(
    userId: string,
    permission: string,
    context?: Record<string, unknown>
  ): Promise<boolean> {
    const permissionDef = PERMISSIONS[permission];
    if (!permissionDef) return false;

    const user = await getUserWithAttributes(userId);
    
    // Check subscription
    if (permissionDef.conditions?.subscription) {
      if (!permissionDef.conditions.subscription.includes(user.subscription)) {
        return false;
      }
    }
    
    // Check platform
    if (permissionDef.conditions?.platform) {
      if (!user.platforms.some(p => permissionDef.conditions!.platform!.includes(p))) {
        return false;
      }
    }
    
    // Check role
    if (permissionDef.conditions?.role) {
      if (!user.roles.some(r => permissionDef.conditions!.role!.includes(r))) {
        return false;
      }
    }
    
    return true;
  }
}
```

**Acceptance Criteria**:
- [ ] Permission checks work
- [ ] All conditions evaluated
- [ ] Performance acceptable
- [ ] Cached for efficiency

---

#### **Task 8.3: Add Permission Middleware** (3 days)

**File**: `packages/auth/src/middleware/permission.middleware.ts` (NEW)

```typescript
export function requirePermission(permission: string) {
  return async (request: NextRequest) => {
    const userId = request.headers.get('x-user-id');
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const abacService = new ABACService();
    const hasPermission = await abacService.checkPermission(userId, permission);
    
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return null; // Allow
  };
}
```

**Usage**:
```typescript
// In route handler
export async function GET(request: NextRequest) {
  const permissionError = await requirePermission('exam:start')(request);
  if (permissionError) return permissionError;
  
  // ... handle request
}
```

**Acceptance Criteria**:
- [ ] Middleware works
- [ ] Permission checks enforced
- [ ] Unauthorized access blocked
- [ ] Error messages clear

---

## 📊 PROGRESS TRACKING

### **Weekly Milestones**

| Week | Phase | Tasks | Deliverables |
|------|-------|-------|--------------|
| 1-2 | Phase 4 | 4.1-4.4 | Gateway fully integrated |
| 3-5 | Phase 6 | 6.1-6.6 | Auth centralized in SkillHubCore |
| 6-7 | Phase 7 | 7.1-7.4 | SSO working across platforms |
| 8-9 | Phase 5 | 5.1-5.4 | Event bus complete |
| 10-12 | Phase 8 | 8.1-8.3 | ABAC implemented |

### **Success Metrics**

| Metric | Current | Target | Measurement |
|--------|---------|--------|-------------|
| Gateway usage | 20% | 100% | % of API calls through gateway |
| Auth centralization | 30% | 100% | % of auth in SkillHubCore |
| SSO adoption | 10% | 100% | % of users with SSO tokens |
| Event-driven | 40% | 100% | % of service communication via events |
| ABAC coverage | 0% | 100% | % of routes with permission checks |

---

## 🚨 RISK MITIGATION

### **High-Risk Items**

1. **Gateway Migration**
   - **Risk**: Breaking existing API calls
   - **Mitigation**: Gradual rollout, feature flags, rollback plan

2. **Auth Service Extraction**
   - **Risk**: Breaking login/register flows
   - **Mitigation**: Parallel deployment, A/B testing, monitoring

3. **SSO Implementation**
   - **Risk**: Token compatibility issues
   - **Mitigation**: Backward compatibility, token migration strategy

### **Rollback Plans**

1. **Gateway**: Keep direct service calls as fallback
2. **Auth**: Keep api-server auth routes until SkillHubCore proven
3. **SSO**: Support both old and new token formats

---

## ✅ DEFINITION OF DONE

### **Phase 4: Gateway Integration**
- [ ] All API calls go through gateway
- [ ] Gateway secret verified by all services
- [ ] Routing table complete
- [ ] End-to-end tests pass
- [ ] Performance acceptable
- [ ] Documentation updated

### **Phase 6: Auth Service Extraction**
- [ ] All auth in SkillHubCore
- [ ] No auth logic in apps
- [ ] Login/register/refresh work
- [ ] Session restoration works
- [ ] All tests pass
- [ ] Documentation updated

### **Phase 7: Multi-Brand SSO**
- [ ] Single login works
- [ ] Cross-platform navigation works
- [ ] Subscription checks work
- [ ] Platform access enforced
- [ ] All tests pass
- [ ] Documentation updated

### **Phase 5: Event Bus**
- [ ] All events defined
- [ ] Event consumers implemented
- [ ] No direct service calls
- [ ] Retry logic works
- [ ] All tests pass
- [ ] Documentation updated

### **Phase 8: ABAC**
- [ ] Permissions defined
- [ ] Permission checks work
- [ ] Middleware enforces permissions
- [ ] All routes protected
- [ ] All tests pass
- [ ] Documentation updated

---

**Document Version**: 1.0  
**Last Updated**: April 13, 2026  
**Next Review**: Weekly during implementation
