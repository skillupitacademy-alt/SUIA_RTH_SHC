import { PERMISSIONS, type Permission } from '@quiz/auth/rbac';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

import { authenticateRequest, createAuthErrorResponse, requireAdminRole, requirePermission } from './auth-helpers';

/** Cookie-authenticated mutations require an explicit, trusted browser origin.
 * Forwarded host headers and the presence of a Bearer header confer no trust.
 */
export function requireAdminMutationOrigin(request: NextRequest): NextResponse | null {
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) return null;
  const allowed = new Set(['https://admin.skillhubcore.in']);
  if (process.env.NODE_ENV !== 'production') {
    allowed.add('http://localhost:3007');
    allowed.add('http://127.0.0.1:3007');
    allowed.add('http://skillhubcore.localhost:3007');
    allowed.add('http://shc.localhost:3007');
    allowed.add('http://admin.skillhubcore.localhost:3007');
  }
  // An exact origin for a separately deployed staging/admin instance.
  if (process.env.SHC_ADMIN_ORIGIN) {
    try {
      const configured = new URL(process.env.SHC_ADMIN_ORIGIN);
      const isLoopback = configured.hostname === 'localhost' || configured.hostname === '127.0.0.1' || configured.hostname.endsWith('.localhost');
      if ((configured.protocol === 'https:' || isLoopback) && !configured.username && !configured.password) {
        allowed.add(configured.origin);
      }
    } catch { /* Invalid configuration must not weaken the default policy. */ }
  }

  let origin = request.headers.get('origin');
  if (!origin || origin === 'null') {
    const referer = request.headers.get('referer');
    if (referer) {
      try {
        origin = new URL(referer).origin;
      } catch {
        origin = null;
      }
    }
  }

  // Allow any .localhost origin on port 3007 in development
  if (process.env.NODE_ENV !== 'production' && origin) {
    try {
      const url = new URL(origin);
      if (
        (url.hostname === 'localhost' || url.hostname === '127.0.0.1' || url.hostname.endsWith('.localhost')) &&
        (url.port === '3007' || url.port === '') &&
        url.protocol === 'http:'
      ) {
        allowed.add(origin);
      }
    } catch { /* Invalid URL format */ }
  }

  if (!origin || !allowed.has(origin)) {
    return NextResponse.json({ error: 'Untrusted request origin' }, {
      status: 403, headers: { 'Cache-Control': 'private, no-store' },
    });
  }
  return null;
}

function routePermission(request: NextRequest): Permission {
  const path = request.nextUrl.pathname.replace(/\/+$/, '');
  const read = request.method === 'GET' || request.method === 'HEAD';
  if (path.startsWith('/api/marketing/')) return PERMISSIONS.ANALYTICS_VIEW;
  if (path.startsWith('/api/tutorial-composer/') || path.startsWith('/api/tutorial-left-sidebar')) {
    if (path.endsWith('/publish')) return PERMISSIONS.TUTORIAL_AUTHOR_PUBLISH;
    // Sidebar POST can publish; require publish permission before reading its body.
    if (path === '/api/tutorial-left-sidebar' && !read) return PERMISSIONS.TUTORIAL_AUTHOR_PUBLISH;
    if (request.method === 'DELETE') return PERMISSIONS.TUTORIAL_AUTHOR_DELETE;
    if (path === '/api/tutorial-composer/sections' && request.method === 'POST') return PERMISSIONS.TUTORIAL_AUTHOR_CREATE;
    return PERMISSIONS.TUTORIAL_AUTHOR_EDIT;
  }
  if (path.startsWith('/api/admin/') && !path.startsWith('/api/admin/auth/')) {
    if (read) return PERMISSIONS.COURSE_READ;
    if (request.method === 'DELETE' || path.endsWith('/batch-delete')) return PERMISSIONS.COURSE_DELETE;
    if (request.method === 'POST') return PERMISSIONS.COURSE_CREATE;
    return PERMISSIONS.COURSE_EDIT;
  }
  return PERMISSIONS.ADMIN_PANEL;
}

/** Call before parsing bodies, querying storage, or forwarding privileged requests. */
export async function requireAdminRequest(request: NextRequest): Promise<NextResponse | null> {
  const auth = await authenticateRequest(request);
  if ('type' in auth) return createAuthErrorResponse(auth);
  const denied = requireAdminRole(auth.user) ?? requirePermission(auth.user, routePermission(request));
  if (denied) return createAuthErrorResponse(denied);
  return requireAdminMutationOrigin(request);
}
