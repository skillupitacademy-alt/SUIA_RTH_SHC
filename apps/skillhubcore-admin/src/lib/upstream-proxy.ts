import { NextRequest } from 'next/server';
import {
  proxyUpstreamRequest as sharedProxyUpstreamRequest,
  FALLBACK_API_BASE_SKILLHUBCORE,
} from '@/share-branding/auth';
import { authenticateRequest, createAuthErrorResponse, requireAdminRole } from './auth-helpers';

export { FALLBACK_API_BASE_SKILLHUBCORE };

type ProxyOptions = Parameters<typeof sharedProxyUpstreamRequest>[1];
const forwardingOrigin = 'https://admin.skillhubcore.in';

/** SHC owns forwarded identity; browser headers never establish internal trust. */
export async function proxyUpstreamRequest(request: NextRequest, options: ProxyOptions) {
  const login = options.upstreamPath === 'api/shc/auth/login';
  const logout = options.upstreamPath === 'api/shc/auth/logout';
  const headers = new Headers();
  for (const name of ['accept', 'content-type', 'x-request-id', 'x-correlation-id']) {
    const value = request.headers.get(name);
    if (value !== null) headers.set(name, value);
  }
  headers.set('host', 'admin.skillhubcore.in');
  headers.set('x-forwarded-proto', 'https');
  headers.set('x-brand', 'skillhubcore');
  // 🔒 SECURITY: Send gateway trust secret so API server can verify this BFF is trusted
  const gatewaySecret = process.env.GATEWAY_TRUST_SECRET;
  if (gatewaySecret) headers.set('x-gateway-secret', gatewaySecret);

  // Public login must work with absent/expired cookies. Logout still clears the
  // browser session when verification fails, without inventing a principal.
  if (!login) {
    const auth = await authenticateRequest(request);
    if ('type' in auth) {
      if (!logout) return createAuthErrorResponse(auth);
    } else {
      const denied = requireAdminRole(auth.user);
      if (denied && !logout) return createAuthErrorResponse(denied);
      if (!denied) {
        const { user } = auth;
        if (/^api\/admin\/questions(?:\/|$)/.test(options.upstreamPath)) {
          headers.set('x-portal-identity', 'shc-admin');
        }
        headers.set('x-user-id', user.userId);
        headers.set('x-original-user-id', user.originalUserId);
        headers.set('x-shadow-user-id', user.shadowUserId);
        headers.set('x-user-roles', user.roles.join(','));
        if (user.email) headers.set('x-user-email', user.email);
        const token = request.cookies.get('accessToken')?.value || request.cookies.get('admin_accessToken')?.value;
        if (token) {
          // Give every downstream token selector the same verified token.
          headers.set('authorization', `Bearer ${token}`);
          headers.set('cookie', `accessToken=${token}; admin_accessToken=${token}`);
        }
      }
    }
  }

  const method = options.method ?? request.method;
  const body = options.body !== undefined ? options.body
    : ['GET', 'HEAD'].includes(method) ? undefined : await request.arrayBuffer();
  const url = new URL(request.nextUrl.pathname + request.nextUrl.search, forwardingOrigin);
  const sanitized = new NextRequest(url, { method, headers });
  return sharedProxyUpstreamRequest(sanitized, { ...options, body });
}
