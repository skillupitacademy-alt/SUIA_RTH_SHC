# 🔥 OBSERVABILITY ENFORCEMENT GUIDE

## Why Enforcement Matters

**The Problem:**
- Optional observability = broken observability
- If developers can forget to add logging, they will
- Silent failures in production are unacceptable

**The Solution:**
- Make observability **automatic** and **mandatory**
- Use wrapper functions that enforce logging
- Request correlation across all services

---

## 🔥 Enforced Architecture

### Request Flow with Correlation

```
Browser Request
    ↓
[withObservability wrapper] → API_REQUEST_START (requestId: abc-123)
    ↓
[Auth Check] → AUTH_SUCCESS (requestId: abc-123)
    ↓
[RBAC Check] → RBAC_AUDIT (requestId: abc-123, result: GRANTED)
    ↓
[Business Logic]
    ↓
[unifiedFetch] → INTERNAL_FETCH (requestId: abc-123)
    ↓
[Response] → API_RESPONSE (requestId: abc-123, duration: 45ms)
```

**Key Point:** Same `requestId` flows through EVERY log entry.

---

## ✅ Correct Implementation

### Step 1: Wrap ALL Route Handlers

**❌ WRONG (No Observability):**
```typescript
// apps/api-server/src/app/api/profile/route.ts
export async function GET(req: NextRequest) {
  const user = await getUser(req);
  const profile = await getProfile(user.id);
  return ApiResponse.success(profile);
}
```

**✅ CORRECT (Enforced Observability):**
```typescript
// apps/api-server/src/app/api/profile/route.ts
import { withObservability } from '@/middleware/observability.middleware';
import { RBACService } from '@quiz/auth/rbac/rbac.service';
import { unifiedFetch } from '@/lib/unifiedFetch';

export const GET = withObservability(async (req, obsCtx) => {
  // obsCtx.requestId is automatically available
  
  // 1. Authenticate
  const user = await getUser(req);
  
  if (!user) {
    // Auth failure is logged automatically by getUser
    return ApiResponse.error({ message: 'Unauthorized' }, 401);
  }
  
  // 2. Check permissions (RBAC logs automatically with requestId)
  RBACService.requirePermission(
    user.roles,
    'PROFILE_READ',
    user.id,
    obsCtx.requestId // 🔥 Pass requestId for correlation
  );
  
  // 3. Fetch data (propagates requestId)
  const response = await unifiedFetch('/api/users/profile', {
    internal: true,
    auth: { userId: user.id, roles: user.roles },
    brand: user.brand,
    requestId: obsCtx.requestId, // 🔥 Propagate requestId
  });
  
  const profile = await response.json();
  
  // 4. Return (response logged automatically)
  return ApiResponse.success(profile);
});
```

---

## 🔥 Request Correlation Rules

### Rule 1: Always Pass requestId to RBAC

```typescript
// ❌ WRONG
RBACService.hasPermission(user.roles, 'PROFILE_READ', user.id);

// ✅ CORRECT
RBACService.hasPermission(
  user.roles, 
  'PROFILE_READ', 
  user.id,
  obsCtx.requestId // 🔥 Correlation
);
```

### Rule 2: Always Pass requestId to unifiedFetch

```typescript
// ❌ WRONG
await unifiedFetch(url, {
  internal: true,
  auth: { userId: user.id },
});

// ✅ CORRECT
await unifiedFetch(url, {
  internal: true,
  auth: { userId: user.id },
  requestId: obsCtx.requestId, // 🔥 Correlation
});
```

### Rule 3: Use obsCtx for All Logging

```typescript
// Inside withObservability handler
export const GET = withObservability(async (req, obsCtx) => {
  // ✅ obsCtx.requestId is available
  // ✅ obsCtx.path is available
  // ✅ obsCtx.method is available
  
  // Use for custom logging
  console.log(JSON.stringify({
    tag: 'CUSTOM_EVENT',
    requestId: obsCtx.requestId,
    userId: user.id,
  }));
});
```

---

## 📊 Verification: The Log Chain

After deploying, make a request and verify the log chain:

```bash
# Make request
curl https://api.skillup.com/profile \
  -H "Cookie: accessToken=..." \
  -H "X-Brand: skillup"

# Check logs (same requestId throughout)
tail -f logs/app.log | grep '"requestId":"abc-123"'
```

**Expected Output:**
```json
{"tag":"API_REQUEST_START","requestId":"abc-123","path":"/api/profile","method":"GET"}
{"tag":"AUTH_SUCCESS","requestId":"abc-123","userId":"user-456","brand":"skillup","roles":["user"]}
{"tag":"RBAC_AUDIT","requestId":"abc-123","userId":"user-456","permission":"PROFILE_READ","result":"GRANTED"}
{"tag":"INTERNAL_FETCH","requestId":"abc-123","url":"https://api.skillup.com/users/456","duration":32}
{"tag":"API_RESPONSE","requestId":"abc-123","status":200,"duration":45}
```

**🔥 Critical:** If requestId is missing or different in any log, correlation is broken.

---

## 🚨 Common Mistakes

### Mistake 1: Forgetting withObservability

```typescript
// ❌ WRONG - No observability
export async function GET(req: NextRequest) {
  // ...
}

// ✅ CORRECT - Enforced observability
export const GET = withObservability(async (req, obsCtx) => {
  // ...
});
```

### Mistake 2: Not Passing requestId

```typescript
// ❌ WRONG - Breaks correlation
RBACService.hasPermission(user.roles, 'PROFILE_READ', user.id);

// ✅ CORRECT - Maintains correlation
RBACService.hasPermission(user.roles, 'PROFILE_READ', user.id, obsCtx.requestId);
```

### Mistake 3: Using Raw fetch()

```typescript
// ❌ WRONG - No logging, no correlation
const res = await fetch(url);

// ✅ CORRECT - Logged and correlated
const res = await unifiedFetch(url, {
  internal: true,
  auth: { userId: user.id },
  requestId: obsCtx.requestId,
});
```

---

## 🎯 Enforcement Checklist

Before deploying any new route:

- [ ] Route wrapped with `withObservability`
- [ ] RBAC calls include `obsCtx.requestId`
- [ ] All `unifiedFetch` calls include `requestId`
- [ ] Custom logs include `requestId`
- [ ] Tested log chain shows same requestId

---

## 🔍 Production Validation

### Step 1: Deploy to Staging

```bash
# Deploy
npm run deploy:staging

# Verify health
curl https://api-staging.skillup.com/health
```

### Step 2: Make Test Request

```bash
curl https://api-staging.skillup.com/profile \
  -H "Cookie: accessToken=..." \
  -H "X-Brand: skillup" \
  -v
```

### Step 3: Extract Request ID

```bash
# From response headers
X-Request-Id: abc-123-def-456
```

### Step 4: Verify Log Chain

```bash
# Query logs by requestId
gcloud logging read 'jsonPayload.requestId="abc-123-def-456"' \
  --format json \
  --limit 50

# Or for local logs
cat logs/app.log | grep '"requestId":"abc-123-def-456"' | jq .
```

### Step 5: Validate Correlation

Check that you see:
1. ✅ API_REQUEST_START
2. ✅ AUTH_SUCCESS (if authenticated)
3. ✅ RBAC_AUDIT (if permission checked)
4. ✅ INTERNAL_FETCH (if BFF → API call)
5. ✅ API_RESPONSE

**All with the SAME requestId.**

---

## 🚀 Production Deployment

Once validated in staging:

```bash
# Deploy to production
npm run deploy:production

# Monitor logs in real-time
npx wrangler tail --env production
# or
gcloud logging tail

# Watch for correlation
# Every request should show full chain with same requestId
```

---

## 📈 Success Metrics

Your observability is production-ready when:

- ✅ **100% route coverage** - All routes use `withObservability`
- ✅ **Request correlation** - Same requestId across all logs
- ✅ **RBAC audit trail** - Every permission check logged
- ✅ **Internal call tracking** - All BFF → API calls logged
- ✅ **Error tracking** - All errors logged with context
- ✅ **Performance metrics** - Duration tracked for all requests

---

## 🎉 You're Production-Grade

With enforced observability:
- ✅ No silent failures
- ✅ Full request tracing
- ✅ Security audit trail
- ✅ Performance monitoring
- ✅ Debuggable production system

**Deploy with confidence.**
