# 🔍 Observability Integration Example

## Complete Example: Instrumented API Route

This shows how to add full observability to an API route.

### Before (No Observability)

```typescript
// apps/api-server/src/app/api/profile/route.ts
import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';

export async function GET(req: NextRequest) {
  const user = await getUser(req);
  const profile = await getProfile(user.id);
  
  return ApiResponse.success(profile);
}
```

### After (Full Observability)

```typescript
// apps/api-server/src/app/api/profile/route.ts
import { NextRequest } from 'next/server';
import { ApiResponse } from '@/lib/api-response';
import { buildRequestContext } from '@/middleware/request-context';
import { logApiRequest, logApiResponse, logApiError, logAuthSuccess, logAuthFailure } from '@quiz/auth/utils/logger';
import { requirePermission } from '@quiz/auth/rbac/enforcer';

export async function GET(req: NextRequest) {
  // 🔍 1. Build request context
  const ctx = buildRequestContext(req);
  const startTime = Date.now();
  
  // 🔍 2. Log request start
  logApiRequest({
    requestId: ctx.requestId,
    path: ctx.path,
    method: ctx.method,
  });

  try {
    // 🔍 3. Authenticate user
    const user = await getUser(req);
    
    if (!user) {
      logAuthFailure({
        requestId: ctx.requestId,
        reason: 'MISSING_TOKEN',
        path: ctx.path,
      });
      return ApiResponse.error({ message: 'Unauthorized' }, 401);
    }

    // 🔍 4. Log auth success
    logAuthSuccess({
      requestId: ctx.requestId,
      userId: user.id,
      brand: user.brand,
      roles: user.roles,
      path: ctx.path,
    });

    // 🔍 5. Check permissions (RBAC audit logged automatically)
    requirePermission(user, 'PROFILE_READ');

    // 🔍 6. Execute business logic
    const profile = await getProfile(user.id);

    // 🔍 7. Log success response
    const duration = Date.now() - startTime;
    logApiResponse({
      requestId: ctx.requestId,
      status: 200,
      duration,
    });

    return ApiResponse.success(profile);
    
  } catch (error) {
    // 🔍 8. Log error
    const duration = Date.now() - startTime;
    logApiError({
      requestId: ctx.requestId,
      error: error.message,
      status: 500,
    });

    return ApiResponse.error({ message: 'Internal error' }, 500);
  }
}
```

---

## Log Output Example

When this route is called, you'll see:

```json
{"tag":"API_REQUEST_START","timestamp":"2024-01-15T10:30:00.000Z","requestId":"abc-123","path":"/api/profile","method":"GET"}
{"tag":"AUTH_SUCCESS","timestamp":"2024-01-15T10:30:00.050Z","requestId":"abc-123","userId":"user-456","brand":"skillup","roles":["user"],"path":"/api/profile"}
{"tag":"RBAC_AUDIT","timestamp":"2024-01-15T10:30:00.051Z","userId":"user-456","roles":["user"],"permission":"PROFILE_READ","result":"GRANTED"}
{"tag":"API_RESPONSE","timestamp":"2024-01-15T10:30:00.095Z","requestId":"abc-123","status":200,"duration":45}
```

---

## Quick Integration Checklist

For each API route, add:

- [ ] `buildRequestContext()` at start
- [ ] `logApiRequest()` at start
- [ ] `logAuthSuccess()` or `logAuthFailure()` after auth
- [ ] `requirePermission()` for RBAC (logs automatically)
- [ ] `logApiResponse()` on success
- [ ] `logApiError()` on error
- [ ] Track `duration` with `Date.now()`

---

## Middleware Approach (Better for Multiple Routes)

Instead of adding to each route, create a middleware:

```typescript
// apps/api-server/src/middleware/observability.middleware.ts
import { NextRequest, NextResponse } from 'next/server';
import { buildRequestContext } from './request-context';
import { logApiRequest, logApiResponse, logApiError } from '@quiz/auth/utils/logger';

export function withObservability(
  handler: (req: NextRequest, ctx: any) => Promise<NextResponse>
) {
  return async (req: NextRequest) => {
    const ctx = buildRequestContext(req);
    const startTime = Date.now();

    logApiRequest({
      requestId: ctx.requestId,
      path: ctx.path,
      method: ctx.method,
    });

    try {
      const response = await handler(req, ctx);
      
      const duration = Date.now() - startTime;
      logApiResponse({
        requestId: ctx.requestId,
        status: response.status,
        duration,
      });

      return response;
    } catch (error) {
      const duration = Date.now() - startTime;
      logApiError({
        requestId: ctx.requestId,
        error: error.message,
        status: 500,
      });

      throw error;
    }
  };
}
```

Then use it:

```typescript
export const GET = withObservability(async (req, ctx) => {
  const user = await getUser(req);
  requirePermission(user, 'PROFILE_READ');
  const profile = await getProfile(user.id);
  return ApiResponse.success(profile);
});
```

---

## Verification

After adding observability, verify it works:

```bash
# 1. Make a request
curl https://api.skillup.com/profile

# 2. Check logs
grep '"requestId":"abc-123"' logs.json | jq .

# Expected output:
# - API_REQUEST_START
# - AUTH_SUCCESS
# - RBAC_AUDIT (GRANTED)
# - API_RESPONSE (200)
```

---

## Production Monitoring Queries

### Find slow requests
```bash
cat logs.json | jq 'select(.tag == "API_RESPONSE" and .duration > 500)'
```

### Find auth failures
```bash
cat logs.json | jq 'select(.tag == "AUTH_FAILURE")'
```

### Find RBAC denials
```bash
cat logs.json | jq 'select(.tag == "RBAC_AUDIT" and .result == "DENIED")'
```

### Trace a specific user
```bash
cat logs.json | jq 'select(.userId == "user-456")'
```

---

## Next Steps

1. **Add to critical routes first:**
   - `/api/auth/login`
   - `/api/auth/refresh`
   - `/api/profile`
   - `/api/dashboard`

2. **Create middleware wrapper** (shown above)

3. **Set up log aggregation:**
   - GCP Cloud Logging
   - Datadog
   - CloudWatch

4. **Create dashboards:**
   - Auth success rate
   - RBAC denial rate
   - API latency p95
   - Error rate by endpoint

5. **Set up alerts:**
   - Auth failure rate > 5%
   - RBAC denial spike
   - API latency > 1s
   - Error rate > 1%
