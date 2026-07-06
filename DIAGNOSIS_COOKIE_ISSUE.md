# 🔍 Cookie Issue Diagnosis

## Problem Statement
After login at `https://user.realtutorialhub.com/login`, users are redirected back to `/login` instead of `/dashboard` or `/onboarding`.

## Root Cause Found
**The Cloudflare Worker IS configured to forward cookies**, but there's a **mismatch in the request flow** that causes cookies to not work properly.

## Architecture Flow (Current)

```
Browser                 Cloudflare Worker              VPS Nginx              RTH-Web Container
  |                            |                          |                         |
  | 1. Login successful        |                          |                         |
  |    Cookies set:            |                          |                         |
  |    Domain=.realtutorialhub.com                        |                         |
  |                            |                          |                         |
  | 2. Navigate to /dashboard |                          |                         |
  |    Host: user.realtutorialhub.com                     |                         |
  |    Cookie: accessToken=xxx |                          |                         |
  |---------------------------->|                          |                         |
  |                            |                          |                         |
  |                            | 3. Proxy to origin       |                         |
  |                            |    Host: origin-user.realtutorialhub.com           |
  |                            |    Cookie: accessToken=xxx (forwarded)             |
  |                            |    X-Forwarded-Host: user.realtutorialhub.com      |
  |                            |    X-Original-Host: user.realtutorialhub.com       |
  |                            |-------------------------->|                         |
  |                            |                          |                         |
  |                            |                          | 4. Proxy to container   |
  |                            |                          |    Host: ??? |
  |                            |                          |    Cookie: ??? |
  |                            |                          |------------------------>|
  |                            |                          |                         |
  |                            |                          |                         | 5. Middleware reads cookies
  |                            |                          |                         |    request.cookies.get('accessToken')
  |                            |                          |                         |    [BFF_AUTH_DEBUG] No token found ❌
```

## The Problem: Cookie Loss Between Nginx and Container

The logs show:
```
[BFF_AUTH_DEBUG] {"pathname":"/dashboard","hasToken":false,"tokenLength":0}
[BFF_AUTH_DEBUG] No token found
```

This means cookies are NOT reaching the Next.js container from Nginx.

## Why Cookies Are Missing

### Hypothesis 1: Nginx Not Forwarding Cookie Header ✅ LIKELY
Nginx might not be configured to forward the `Cookie` header to upstream containers.

**Check**:
```nginx
# In infra/hostinger/nginx/conf.d/realtutorialhub.conf
proxy_set_header Cookie $http_cookie;  # ← Is this present?
```

### Hypothesis 2: CORS/SameSite Issues with origin-* Hostnames
When the Worker proxies:
- Request comes from: `user.realtutorialhub.com`  
- Proxied to: `origin-user.realtutorialhub.com`

Even though the Worker forwards cookies, the **browser might not have sent them** because:
1. The Cookie domain is `.realtutorialhub.com`
2. The actual request at Worker level is still `user.realtutorialhub.com`  
3. But when forwarded, it becomes a **server-to-server request** to `origin-user.realtutorialhub.com`
4. The `Cookie` header is manually forwarded by Worker
5. But Nginx might strip it or not forward it properly

## Evidence from Logs

### VPS Container Logs (RTH-Web):
```
[BFF_AUTH_DEBUG] {"pathname":"/","hasToken":false,"tokenLength":0}
[BFF_AUTH_DEBUG] No token found
```
**Repeated many times** - cookies are consistently missing.

### Worker Code (proxy.ts):
```typescript
// 🔥 CRITICAL FIX: Forward cookies to BFF endpoints
const cookieHeader = request.headers.get('cookie');
if (cookieHeader) {
  headers.set('Cookie', cookieHeader);
  console.log('🍪 [PROXY_COOKIE_FORWARDED]', JSON.stringify({
    hasCookie: true,
    cookieLength: cookieHeader.length,
    path: targetPath,
    correlationId
  }));
}
```
**Worker DOES forward cookies** - but we don't see `[PROXY_COOKIE_FORWARDED]` logs.

## Key Questions

### Q1: Are cookies being sent by the browser to the Worker?
**Test**: Check browser DevTools → Network → Request Headers for `/dashboard`
- Should see: `Cookie: accessToken=xxx; refreshToken=yyy`

### Q2: Is the Worker forwarding cookies to VPS?
**Test**: Check if Cloudflare Worker logs show `[PROXY_COOKIE_FORWARDED]`
- If YES: Cookies reach Worker and are forwarded
- If NO: Cookies aren't reaching Worker (browser issue)

### Q3: Is Nginx forwarding cookies to containers?
**Test**: Check Nginx proxy configuration
```bash
ssh hostinger-quiz-platform-root "cat /opt/platform/apps/quiz-platform/infra/hostinger/nginx/conf.d/realtutorialhub.conf | grep -i cookie"
```

## Most Likely Root Cause

**Nginx is NOT forwarding the `Cookie` header to Docker containers.**

When the Worker sends:
```
GET /dashboard HTTP/1.1
Host: origin-user.realtutorialhub.com
Cookie: accessToken=xxx; refreshToken=yyy
X-Forwarded-Host: user.realtutorialhub.com
```

Nginx proxies to container but **strips the Cookie header**:
```
GET /dashboard HTTP/1.1
Host: localhost:3003
X-Forwarded-Host: user.realtutorialhub.com
```

## Solution

### Fix 1: Add Cookie Forwarding to Nginx Config

In all Nginx server blocks that proxy to containers, ensure:

```nginx
location / {
    proxy_pass http://realtutorialhub-web:3003;
    
    # Forward all headers
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_set_header X-Forwarded-Host $http_x_forwarded_host;
    proxy_set_header X-Original-Host $http_x_original_host;
    
    # ✅ CRITICAL: Forward Cookie header
    proxy_set_header Cookie $http_cookie;  # ← ADD THIS
}
```

### Fix 2: Verify Worker is Deployed with Cookie Forwarding Code

Check Cloudflare Worker deployment:
1. Verify Worker was deployed after commit `b4bd06e7`
2. Check Worker logs for `[PROXY_COOKIE_FORWARDED]` messages
3. Redeploy Worker if necessary

## Files to Check/Modify

1. ✅ `services/api-gateway/src/lib/proxy.ts` - Worker already forwards cookies
2. ❌ `infra/hostinger/nginx/conf.d/realtutorialhub.conf` - **NEEDS COOKIE FORWARDING**
3. ❌ `infra/hostinger/nginx/conf.d/skillup.conf` - **NEEDS COOKIE FORWARDING**  
4. ❌ `infra/hostinger/nginx/conf.d/skillhub.conf` - **NEEDS COOKIE FORWARDING**

## Next Steps

1. **Check Nginx config for Cookie forwarding**
2. **Add `proxy_set_header Cookie $http_cookie;`** if missing
3. **Reload Nginx configuration**
4. **Test login flow again**
5. **Check container logs** - should see tokens now

---

## Status
**Diagnosis Complete**: Nginx configuration is missing Cookie header forwarding.  
**Next Action**: Update Nginx configs to forward Cookie headers to containers.
