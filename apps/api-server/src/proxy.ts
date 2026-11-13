// Edge-compatible UUID generation using standard web crypto
import { RBACService } from '@quiz/auth/rbac';
import { PERMISSIONS } from '@quiz/auth/rbac/permissions';
import type { Role } from '@quiz/auth/rbac/roles';
import crypto from 'crypto';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { ApiError } from '@/lib/api-error';
import { validateCurrentLearnerContext } from '@/lib/auth-context';
import { container } from '@/modules/core/container';

import {
  hasConflictingRequestTenantContext,
  resolveRequestHostnameFromHeaders,
} from './lib/request-brand';
import { applyApiVersion } from './middleware/api-version.middleware';
import { withEtags } from './middleware/etag.middleware';
import { corsMiddleware } from './modules/auth/cors.middleware';
import { csrfProtection, setCsrfToken } from './modules/auth/csrf.middleware';
import { _verifyActiveAccount, _verifyAdmin } from './modules/auth/rbac.service';
import { TokenService } from './modules/auth/token.service';

export async function proxy(request: NextRequest) {
  const requestId = request.headers.get('x-request-id') ?? crypto.randomUUID();
  const sessionId = request.headers.get('x-session-id') ?? 'anon-' + crypto.randomUUID().slice(0, 8);
  const pathname = request.nextUrl.pathname;

  // DIAGNOSTIC LOG (User visible in Vercel)
  if (pathname.includes('security/report')) {
    const authHeader = request.headers.get('authorization');
    console.log(`[PROXY] Intercepted: ${pathname} | Method: ${request.method} | User: ${authHeader !== null && authHeader !== '' ? 'Yes' : 'No'}`);
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-request-id', requestId);
  requestHeaders.set('x-session-id', sessionId);

  // 2. CORS Preflight
  if (request.method === 'OPTIONS') {
    const response = new NextResponse(null, { status: 204 });
    return corsMiddleware(request, response);
  }

  // 3. Only apply to /api routes
  if (!request.nextUrl.pathname.startsWith('/api')) {
    return NextResponse.next({
      request: { headers: requestHeaders }
    });
  }

  const isAuthRoute = request.nextUrl.pathname.startsWith('/api/auth') ||
    request.nextUrl.pathname.startsWith('/api/admin/auth') ||
    request.nextUrl.pathname.startsWith('/api/shc/auth');

  const isTutorialRoute = request.nextUrl.pathname.startsWith('/api/tutorial');
  const isSecurityReport = pathname.toLowerCase().includes('security/report');
  const isClientLogsRoute = pathname === '/api/logs/client';
  const isWorkflowRoute = pathname.startsWith('/api/workflows') || pathname.startsWith('/api/api/workflows') || pathname.startsWith('/api/export/workflow') || pathname.startsWith('/api/api/export/workflow');
  const isHealthRoute =
    pathname === '/api/health' ||
    pathname === '/api/health/live' ||
    pathname === '/api/health/ready';
  const isSearchRoute = pathname === '/api/search';
  const isTelemetryRoute = pathname === '/api/telemetry';
  const isGatewayExemptRoute =
    isHealthRoute ||
    isWorkflowRoute ||
    isAuthRoute ||
    isTutorialRoute ||
    isSearchRoute ||
    isTelemetryRoute ||
    isSecurityReport ||
    isClientLogsRoute;

  // 4. CSRF Protection for mutations
  if (!isAuthRoute) {
    if (!isSecurityReport && !isWorkflowRoute) {
      const csrfResponse = await csrfProtection(request);
      if (csrfResponse !== null && csrfResponse !== undefined) {
        return corsMiddleware(request, csrfResponse);
      }
    }
  }

  const isProtectedAuthRoute = ['/api/auth/sessions', '/api/auth/logout-all', '/api/auth/heartbeat',
    '/api/auth/profile', '/api/auth/onboarding', '/api/auth/debug/profile-integrity']
    .some(path => pathname === path || pathname.startsWith(`${path}/`));
  const hasTutorialUserCredential = isTutorialRoute &&
    (request.cookies.has('accessToken') || request.headers.has('authorization'));
  if ((!isAuthRoute && !isGatewayExemptRoute) || isProtectedAuthRoute || hasTutorialUserCredential) {
    const pathname = request.nextUrl.pathname;
    const portalIdentity = request.headers.get('x-portal-identity') ?? 'user';
    let scope: 'admin' | 'user' | 'infrastructure' = 'user';
    let expectedAudience: 'admin' | 'user' | 'infra' | 'shc-admin' = 'user';

    if (portalIdentity === 'shc-admin') {
      scope = 'admin';
      expectedAudience = 'shc-admin';
    } else if (portalIdentity === 'infrastructure') {
      scope = 'infrastructure';
      expectedAudience = 'infra';
    } else if (pathname.startsWith('/api/admin') || pathname.startsWith('/api/factory') || pathname.startsWith('/api/analytics/admin') || portalIdentity === 'admin') {
      scope = 'admin';
      expectedAudience = 'admin';
    }

    const _token = container.get(TokenService).getAccessToken(request, { scope });
    const internalKey = request.headers.get('x-internal-key');
    const authHeader = request.headers.get('authorization');

    const isValidInternalKey = internalKey !== null && internalKey !== '' &&
      process.env.INTERNAL_API_KEY !== undefined && process.env.INTERNAL_API_KEY !== '' &&
      internalKey === process.env.INTERNAL_API_KEY;
    if (internalKey !== null && !isValidInternalKey) {
      const response = NextResponse.json({ error: 'Invalid internal service key' }, { status: 403 });
      response.headers.set('x-request-id', requestId);
      response.headers.set('x-session-id', sessionId);
      return corsMiddleware(request, response);
    }
    const isValidCronAuth = authHeader !== null && process.env.CRON_SECRET !== undefined && authHeader === `Bearer ${process.env.CRON_SECRET}`;

    const isSystemBypass = isValidInternalKey || isValidCronAuth;

    if (!isSystemBypass && (_token === undefined || _token === null || _token === '')) {
      const response = NextResponse.json(
        { error: 'Authentication required', scope },
        { status: 401 }
      );
      response.headers.set('x-request-id', requestId);
      response.headers.set('x-session-id', sessionId);
      return corsMiddleware(request, response);
    }

    if (!isSystemBypass) {
      try {
        const tokenService = container.get(TokenService);
        const isAdmin = scope === 'admin' || scope === 'infrastructure';
        const _payload = isAdmin
          ? await tokenService.verifyAdminAccessToken(_token!, { audience: expectedAudience })
          : await tokenService.verifyUserAccessToken(_token!, { audience: expectedAudience });

        if (scope === 'user' && (_payload.brand === 'skillup' || _payload.brand === 'realtutorialhub')) {
          const current = await validateCurrentLearnerContext({
            userId: _payload.userId, brand: _payload.brand, roles: _payload.roles,
            source: 'jwt', correlationId: requestId, email: _payload.email,
          }, request);
          if (current === null) {
            return corsMiddleware(request, NextResponse.json({ error: 'Authentication required' }, {
              status: 401, headers: { 'Cache-Control': 'private, no-store', 'x-request-id': requestId },
            }));
          }
        }

        const isAdministrativePath =
          pathname.startsWith('/api/admin') ||
          pathname.startsWith('/api/factory') ||
          pathname.startsWith('/api/analytics/admin');

        const isShcAnalyticsDenial =
          pathname.startsWith('/api/analytics/admin') &&
          (portalIdentity === 'shc-admin' || _payload.brand === 'skillhubcore');

        const isShcAdminRoute =
          (pathname.startsWith('/api/admin') || pathname.startsWith('/api/factory')) &&
          portalIdentity === 'shc-admin';

        const isInfraAdminRoute =
          pathname.startsWith('/api/admin') && portalIdentity === 'infrastructure';

        const isInfraFactoryOrAnalyticsRoute =
          (pathname.startsWith('/api/factory') || pathname.startsWith('/api/analytics/admin')) &&
          portalIdentity === 'infrastructure';

        const isAdminRoute =
          isAdministrativePath &&
          !pathname.startsWith('/api/admin/auth') &&
          portalIdentity !== 'infrastructure' &&
          portalIdentity !== 'shc-admin';

        if (isShcAnalyticsDenial) {
          const res = NextResponse.json(
            { error: 'Forbidden: SkillHubCore admin access not permitted for tenant analytics' },
            { status: 403 }
          );
          res.headers.set('x-request-id', requestId);
          return corsMiddleware(request, res);
        } else if (isShcAdminRoute) {
          const roles = (Array.isArray(_payload.roles) ? _payload.roles : [])
            .map((role) => typeof role === 'string' ? role.toLowerCase() : null)
            .filter((role): role is string => role !== null);

          const hasShcAdminAccess =
            _payload.brand === 'skillhubcore' &&
            _payload.isAdmin === true &&
            (roles.includes('admin') || roles.includes('super_admin') || roles.includes('infrastructure'));

          if (!hasShcAdminAccess) {
            const res = NextResponse.json({ error: 'Forbidden: SkillHubCore admin access required' }, { status: 403 });
            res.headers.set('x-request-id', requestId);
            return corsMiddleware(request, res);
          }
        } else if (isInfraAdminRoute) {
          const roles = (Array.isArray(_payload.roles) ? _payload.roles : [])
            .map(r => typeof r === 'string' ? r.toLowerCase() : null)
            .filter((r): r is Role => r !== null) as Role[];

          if (!RBACService.hasPermission(roles, PERMISSIONS.ADMIN_PANEL)) {
            const res = NextResponse.json({ error: 'Forbidden: Infrastructure privileges required' }, { status: 403 });
            res.headers.set('x-request-id', requestId);
            return corsMiddleware(request, res);
          }
        } else if (isInfraFactoryOrAnalyticsRoute) {
          const roles = (Array.isArray(_payload.roles) ? _payload.roles : [])
            .map(r => typeof r === 'string' ? r.toLowerCase() : null)
            .filter((r): r is Role => r !== null) as Role[];

          if (!RBACService.hasPermission(roles, PERMISSIONS.ADMIN_PANEL)) {
            const res = NextResponse.json({ error: 'Forbidden: Infrastructure privileges required' }, { status: 403 });
            res.headers.set('x-request-id', requestId);
            return corsMiddleware(request, res);
          }

          const tenantBrand = typeof _payload.brand === 'string' ? _payload.brand : '';
          const isAccountActive = await _verifyActiveAccount(_payload.userId, tenantBrand);
          if (!isAccountActive) {
            const res = NextResponse.json({ error: 'Forbidden: Tenant account is inactive or missing' }, { status: 403 });
            res.headers.set('x-request-id', requestId);
            return corsMiddleware(request, res);
          }
        } else if (isAdminRoute) {
          if (
            hasConflictingRequestTenantContext(
              _payload.brand,
              _payload.tokenType,
              request.headers,
              request.nextUrl?.hostname
            )
          ) {
            const res = NextResponse.json(
              { error: 'Forbidden: Conflicting request tenant context' },
              { status: 403 }
            );
            res.headers.set('x-request-id', requestId);
            return corsMiddleware(request, res);
          }

          const hasAdminAccess = await _verifyAdmin(_payload);
          if (!hasAdminAccess) {
            const res = NextResponse.json({ error: 'Forbidden: Admin access only' }, { status: 403 });
            res.headers.set('x-request-id', requestId);
            return corsMiddleware(request, res);
          }
        }


      } catch (_error: unknown) {
        const unavailable = _error instanceof ApiError && _error.status === 503;
        const res = NextResponse.json({ error: unavailable ? 'Authentication unavailable' : 'Invalid or expired token' }, {
          status: unavailable ? 503 : 401, headers: { 'Cache-Control': 'private, no-store' },
        });
        res.headers.set('x-request-id', requestId);
        return corsMiddleware(request, res);
      }
    }
  }

  // 6. Finalize Response using modern proxy forwarding
  const response = NextResponse.next({
    request: { headers: requestHeaders }
  });

  // Task 103: Warn on responses > 1MB
  const contentLengthHeader = response.headers.get('content-length');
  const contentLength = contentLengthHeader !== null ? parseInt(contentLengthHeader, 10) : null;
  if (contentLength !== null && contentLength > 1_048_576) {
    console.warn(`[WARN] Large response payload: ${request.nextUrl.pathname} (${contentLength} bytes)`);
  }

  applyApiVersion(request, response);
  if (!isHealthRoute) {
    const requestHostname = resolveRequestHostnameFromHeaders(request.headers, request.nextUrl.hostname);
    setCsrfToken(response, requestHostname);
  }
  response.headers.set('x-request-id', requestId);
  response.headers.set('x-session-id', sessionId);

  // Expose headers to frontend
  response.headers.set('Access-Control-Expose-Headers', 'x-request-id, x-session-id, x-csrf-token, X-Duration-Ms');

  const finalResponse = corsMiddleware(request, response) as NextResponse;
  return await withEtags(request, finalResponse);
}

export const config = {
  matcher: '/api/:path*',
};
