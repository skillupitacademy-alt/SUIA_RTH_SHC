import { NextResponse, type NextRequest } from 'next/server';
import { requireAdminMutationOrigin, requireAdminRequest } from '@/lib/admin-route-guard';
import { isProtectedAdminPage, isPublicPath } from './lib/admin-page-policy';
import { sanitizeRedirectUrl } from './lib/sanitize-redirect';
import { evaluateRequestPageAccess, signPageAdmissionAssertion } from './lib/server-page-auth';

/**
 * Next.js Edge Middleware for SkillHubCore Admin.
 *
 * Enforces server-side authentication and authorization admission on all 32 protected
 * admin pages (HTML, RSC, HEAD, prefetch) before any React Server Components render.
 *
 * Unauthenticated users are redirected to /login?redirect=...
 * Authenticated non-admin or unauthorized roles are redirected to /forbidden (403).
 * Upstream and internal API routes (/api/*) are guarded by admin-route-guard and 80 handlers.
 */
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. API Route Guards — explicit auth, origin check, health & login exceptions
  if (path.startsWith('/api/')) {
    if (path === '/api/health') return NextResponse.next();
    const publicAuth = path === '/api/auth/login' || path === '/api/auth/logout';
    const denied = publicAuth
      ? requireAdminMutationOrigin(request)
      : await requireAdminRequest(request);
    if (denied) return denied;
    const response = NextResponse.next();
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }

  // 2. Public / Exempt Pages & Framework Assets
  if (isPublicPath(path)) {
    return NextResponse.next();
  }

  // 3. Protected Page Server-Side Admission (HTML, RSC, HEAD, Prefetch)
  if (isProtectedAdminPage(path)) {
    const outcome = await evaluateRequestPageAccess(request);

    if (outcome.status === 'UNAUTHENTICATED') {
      const destination = sanitizeRedirectUrl(path + request.nextUrl.search, '/dashboard');
      const loginUrl = new URL('/login', request.url);
      if (destination && destination !== '/dashboard' && destination !== '/') {
        loginUrl.searchParams.set('redirect', destination);
      }
      const response = NextResponse.redirect(loginUrl);
      response.headers.set('Cache-Control', 'private, no-store');
      return response;
    }

    if (outcome.status === 'FORBIDDEN') {
      const forbiddenUrl = new URL('/forbidden', request.url);
      const response = NextResponse.redirect(forbiddenUrl);
      response.headers.set('Cache-Control', 'private, no-store');
      return response;
    }

    if (outcome.status === 'UNAVAILABLE') {
      return new NextResponse('Service Unavailable', {
        status: 503,
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'private, no-store',
        },
      });
    }

    // Outcome is AUTHORIZED:
    // Sign downstream admission assertion to prevent duplicate live network checks in layouts.
    const assertion = await signPageAdmissionAssertion(outcome.user, path);
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set('x-shc-pathname', path);
    requestHeaders.set('x-shc-admission-assertion', assertion);

    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    });
    response.headers.set('Cache-Control', 'private, no-store');
    return response;
  }

  // Fallback passthrough for any other unclassified asset
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
