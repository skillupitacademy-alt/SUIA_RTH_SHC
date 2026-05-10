import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { AUTH_CONFIG } from './config';
import { unifiedFetch } from '../lib/unifiedFetch';

const HOP_BY_HOP_HEADERS = new Set([
  'connection',
  'content-length',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
]);

/**
 * 🔥 GATEWAY-FIRST ARCHITECTURE
 * ALL requests MUST go through the API Gateway.
 * NO direct API server calls allowed.
 */
function getGatewayUrl(hostname?: string): string {
  // Determine brand from hostname
  const isSkillUp = hostname?.includes('skillup') ?? false;
  const isSkillHubCore = hostname?.includes('skillhubcore') ?? false;
  
  // Use brand-specific gateway URL
  let gatewayUrl: string | undefined;
  if (isSkillHubCore) {
    gatewayUrl = process.env.GATEWAY_URL_SKILLHUBCORE;
  } else if (isSkillUp) {
    gatewayUrl = process.env.GATEWAY_URL_SKILLUP;
  } else {
    gatewayUrl = process.env.GATEWAY_URL;
  }
  
  if (!gatewayUrl || gatewayUrl.trim().length === 0) {
    throw new Error('GATEWAY_URL not configured - all requests must go through API Gateway');
  }
  
  return gatewayUrl.trim().replace(/\/+$/, '');
}

export function getConfiguredAuthBaseUrls(fallbackApiBase: string, hostname?: string): string[] {
  // 🔥 CRITICAL: Only return gateway URL - no fallbacks, no bypasses
  try {
    return [getGatewayUrl(hostname)];
  } catch {
    // If gateway URL not configured, throw error - don't allow fallback
    throw new Error('GATEWAY_URL must be configured - direct API access is forbidden');
  }
}

export function getUpstreamUrls(fallbackApiBase: string, upstreamPath: string, hostname?: string): string[] {
  const normalizedPath = upstreamPath.replace(/^\/+/, '');
  const gatewayUrl = getGatewayUrl(hostname);
  
  // Gateway URLs already include routing - just append the path
  return [`${gatewayUrl}/${normalizedPath}`];
}

export function getAuthUpstreamUrls(fallbackApiBase: string, authPath: string, hostname?: string): string[] {
  const normalizedAuthPath = authPath.replace(/^\/+/, '');
  const gatewayUrl = getGatewayUrl(hostname);
  
  // Gateway handles auth routing - use /auth prefix
  return [`${gatewayUrl}/auth/${normalizedAuthPath}`];
}

function normalizeHost(value?: string | null): string | undefined {
  if (typeof value !== 'string') return undefined;
  const trimmed = value.trim().toLowerCase();
  if (trimmed.length === 0) return undefined;

  const host = trimmed.split('/')[0]?.split(':')[0]?.replace(/^\.+/, '');
  if (host === undefined || host.length === 0 || host.includes('.') === false) {
    return undefined;
  }

  const labels = host.split('.').filter(Boolean);
  if (labels.length <= 2) return host;
  return `.${labels.slice(-2).join('.')}`;
}

function getRequestHost(request: NextRequest): string | undefined {
  const forwardedHost = request.headers.get('x-forwarded-host');
  if (typeof forwardedHost === 'string' && forwardedHost.trim().length > 0) {
    return forwardedHost.split(',')[0]?.trim();
  }

  return request.headers.get('host') ?? request.nextUrl.hostname;
}

export function rewriteSetCookie(cookie: string, requestHost?: string): string {
  const cookieDomain = normalizeHost(requestHost);
  if (cookieDomain === undefined) {
    return cookie.replace(/;\s*Domain=[^;]+/i, '');
  }

  if (/;\s*Domain=/i.test(cookie)) {
    return cookie.replace(/;\s*Domain=[^;]+/i, `; Domain=${cookieDomain}`);
  }

  return `${cookie}; Domain=${cookieDomain}`;
}

export function getSetCookies(headers: Headers): string[] {
  const withHelper = headers as Headers & { getSetCookie?: () => string[] };
  if (typeof withHelper.getSetCookie === 'function') {
    return withHelper.getSetCookie();
  }

  const combined = headers.get('set-cookie');
  return combined === null || combined.trim().length === 0 ? [] : [combined];
}

export function extractCookieValue(setCookies: string[], cookieName: string): string | undefined {
  for (const cookie of setCookies) {
    const match = new RegExp(`(?:^|\\s*)${cookieName}=([^;]+)`, 'i').exec(cookie);
    if (match?.[1] !== undefined) {
      try {
        return decodeURIComponent(match[1]);
      } catch {
        return match[1];
      }
    }
  }

  return undefined;
}

export function createForwardHeaders(request: NextRequest): Headers {
  const headers = new Headers(request.headers);
  headers.delete('host');
  headers.delete('content-length');
  
  // 🔥 CRITICAL: Add internal secret for BFF → API authentication
  const internalSecret = process.env.INTERNAL_API_SECRET;
  if (internalSecret) {
    headers.set('x-internal-secret', internalSecret);
  } else {
    console.error('[BFF_AUTH] INTERNAL_API_SECRET not configured - BFF → API calls will fail');
  }
  
  // 🔐 ENTERPRISE AUTH: Preserve device context headers
  // These headers are CRITICAL for multi-device session tracking
  const deviceId = request.headers.get('x-device-id');
  const deviceName = request.headers.get('x-device-name');
  const forwardedFor = request.headers.get('x-forwarded-for');
  const userAgent = request.headers.get('user-agent');
  
  // Always forward device headers (even if empty, backend will generate fallbacks)
  if (deviceId) {
    headers.set('x-device-id', deviceId);
  }
  if (deviceName) {
    headers.set('x-device-name', deviceName);
  }
  if (forwardedFor) {
    headers.set('x-forwarded-for', forwardedFor);
  }
  if (userAgent) {
    headers.set('user-agent', userAgent);
  }
  
  // 🏷️ BRAND RESOLUTION: Add x-brand header based on hostname
  if (!headers.has('x-brand')) {
    const hostname = getRequestHost(request);
    if (hostname) {
      let brand: string;
      if (hostname.includes('skillhubcore')) {
        brand = 'skillhubcore';
      } else if (hostname.includes('skillup')) {
        brand = 'skillup';
      } else {
        brand = 'realtutorialhub';
      }
      headers.set('x-brand', brand);
      
      // 📊 OBSERVABILITY: Log brand resolution and internal secret status
      console.log(JSON.stringify({
        tag: 'AUTH_FLOW',
        action: 'create_forward_headers',
        hostname,
        brand,
        hasDeviceId: !!deviceId,
        hasInternalSecret: !!internalSecret,
      }));
    }
  }
  
  return headers;
}

export async function fetchUpstream(
  request: NextRequest,
  options: {
    fallbackApiBase: string;
    upstreamPath: string;
    method?: string;
    body?: BodyInit | null;
  },
): Promise<Response | null> {
  const method = options.method ?? request.method;
  const body =
    options.body !== undefined
      ? options.body
      : method === 'GET' || method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();
  const headers = createForwardHeaders(request);
  const hostname = getRequestHost(request);

  let upstreamResponse: Response | null = null;

  for (const url of getUpstreamUrls(options.fallbackApiBase, options.upstreamPath, hostname)) {
    const candidate = await unifiedFetch(`${url}${request.nextUrl.search}`, {
      method,
      headers,
      body,
      redirect: 'manual',
      cache: 'no-store',
    });

    upstreamResponse = candidate;
    if (candidate.status !== 404) {
      break;
    }
  }

  return upstreamResponse;
}

export async function fetchAuthUpstream(
  request: NextRequest,
  options: {
    fallbackApiBase: string;
    authPath: string;
    method?: string;
    body?: BodyInit | null;
  },
): Promise<Response | null> {
  const method = options.method ?? request.method;
  const body =
    options.body !== undefined
      ? options.body
      : method === 'GET' || method === 'HEAD'
      ? undefined
      : await request.arrayBuffer();
  const headers = createForwardHeaders(request);
  const hostname = getRequestHost(request);

  let upstreamResponse: Response | null = null;

  for (const url of getAuthUpstreamUrls(options.fallbackApiBase, options.authPath, hostname)) {
    const candidate = await unifiedFetch(`${url}${request.nextUrl.search}`, {
      method,
      headers,
      body,
      redirect: 'manual',
      cache: 'no-store',
    });

    upstreamResponse = candidate;
    if (candidate.status !== 404) {
      break;
    }
  }

  return upstreamResponse;
}

export async function proxyUpstreamRequest(
  request: NextRequest,
  options: {
    fallbackApiBase: string;
    upstreamPath: string;
    method?: string;
    body?: BodyInit | null;
  },
) {
  const upstreamResponse = await fetchUpstream(request, options);

  if (upstreamResponse === null) {
    return NextResponse.json({ error: 'Upstream unavailable' }, { status: 502 });
  }

  const payload = await upstreamResponse.arrayBuffer();
  const response = new NextResponse(payload, {
    status: upstreamResponse.status,
    statusText: upstreamResponse.statusText,
  });

  upstreamResponse.headers.forEach((value, key) => {
    if (HOP_BY_HOP_HEADERS.has(key.toLowerCase()) || key.toLowerCase() === 'set-cookie') {
      return;
    }
    response.headers.set(key, value);
  });

  const requestHost = getRequestHost(request);
  for (const cookie of getSetCookies(upstreamResponse.headers)) {
    response.headers.append('set-cookie', rewriteSetCookie(cookie, requestHost));
  }

  return response;
}

export async function proxyAuthRequest(
  request: NextRequest,
  options: {
    fallbackApiBase: string;
    authPath: string;
    method?: string;
    body?: BodyInit | null;
  },
) {
  // 📊 OBSERVABILITY: Log auth proxy request and current mode
  const hostname = getRequestHost(request);
  let brand: string;
  if (hostname?.includes('skillhubcore')) {
    brand = 'skillhubcore';
  } else if (hostname?.includes('skillup')) {
    brand = 'skillup';
  } else {
    brand = 'realtutorialhub';
  }
  
  console.log(JSON.stringify({
    tag: 'AUTH_FLOW',
    action: 'proxy_auth_request',
    authPath: options.authPath,
    method: options.method ?? request.method,
    brand,
    hostname,
  }));

  // 📊 PHASE 5: Log current configuration mode
  console.log(JSON.stringify({
    tag: 'AUTH_FLOW_MODE',
    fallbackEnabled: AUTH_CONFIG.ENABLE_FALLBACK,
    strictGateway: AUTH_CONFIG.STRICT_GATEWAY,
    phase: 'phase_5_safe_mode',
  }));

  // 🔥 PHASE 5: Gateway-first execution
  const gatewayUrl = getGatewayUrl(hostname);
  const targetUrl = `${gatewayUrl}/auth/${options.authPath}`;
  const headers = createForwardHeaders(request);
  const method = options.method ?? request.method;
  const body = options.body !== undefined
    ? options.body
    : method === 'GET' || method === 'HEAD'
    ? undefined
    : await request.arrayBuffer();

  try {
    // 🟢 PRIMARY: Gateway call
    const upstreamResponse = await unifiedFetch(`${targetUrl}${request.nextUrl.search}`, {
      method,
      headers,
      body,
      redirect: 'manual',
      cache: 'no-store',
    });

    // ✅ SUCCESS → return immediately
    if (upstreamResponse.ok || upstreamResponse.status < 500) {
      console.log(JSON.stringify({
        tag: 'AUTH_METRIC',
        type: 'gateway_success',
        status: upstreamResponse.status,
        authPath: options.authPath,
        brand,
      }));

      // Process successful response
      const payload = await upstreamResponse.arrayBuffer();
      const response = new NextResponse(payload, {
        status: upstreamResponse.status,
        statusText: upstreamResponse.statusText,
      });

      upstreamResponse.headers.forEach((value, key) => {
        if (HOP_BY_HOP_HEADERS.has(key.toLowerCase()) || key.toLowerCase() === 'set-cookie') {
          return;
        }
        response.headers.set(key, value);
      });

      const requestHost = getRequestHost(request);
      for (const cookie of getSetCookies(upstreamResponse.headers)) {
        response.headers.append('set-cookie', rewriteSetCookie(cookie, requestHost));
      }

      return response;
    }

    // ❌ Gateway returned 5xx error
    throw new Error(`Gateway failed with ${upstreamResponse.status}`);

  } catch (err) {
    // 📊 OBSERVABILITY: Log gateway failure
    console.log(JSON.stringify({
      tag: 'AUTH_GATEWAY_FAIL',
      authPath: options.authPath,
      error: err instanceof Error ? err.message : 'Unknown error',
      brand,
      hostname,
    }));

    console.log(JSON.stringify({
      tag: 'AUTH_METRIC',
      type: 'gateway_failure',
      authPath: options.authPath,
      brand,
    }));

    // 🔴 STRICT MODE → NO fallback
    if (AUTH_CONFIG.STRICT_GATEWAY) {
      console.log(JSON.stringify({
        tag: 'AUTH_FLOW',
        action: 'strict_mode_503',
        authPath: options.authPath,
        reason: 'gateway_failed_strict_mode',
      }));

      return NextResponse.json(
        { error: 'Authentication service temporarily unavailable' },
        { status: 503 }
      );
    }

    // 🟡 FALLBACK (ONLY if enabled)
    if (AUTH_CONFIG.ENABLE_FALLBACK && options.fallbackApiBase) {
      console.log(JSON.stringify({
        tag: 'AUTH_FALLBACK_TRIGGERED',
        authPath: options.authPath,
        fallbackApiBase: options.fallbackApiBase,
        brand,
      }));

      console.log(JSON.stringify({
        tag: 'AUTH_METRIC',
        type: 'fallback_used',
        authPath: options.authPath,
        brand,
      }));

      try {
        const fallbackUrl = `${options.fallbackApiBase}/auth/${options.authPath}`;
        const fallbackResponse = await unifiedFetch(`${fallbackUrl}${request.nextUrl.search}`, {
          method,
          headers,
          body,
          redirect: 'manual',
          cache: 'no-store',
        });

        const payload = await fallbackResponse.arrayBuffer();
        const response = new NextResponse(payload, {
          status: fallbackResponse.status,
          statusText: fallbackResponse.statusText,
        });

        fallbackResponse.headers.forEach((value, key) => {
          if (HOP_BY_HOP_HEADERS.has(key.toLowerCase()) || key.toLowerCase() === 'set-cookie') {
            return;
          }
          response.headers.set(key, value);
        });

        const requestHost = getRequestHost(request);
        for (const cookie of getSetCookies(fallbackResponse.headers)) {
          response.headers.append('set-cookie', rewriteSetCookie(cookie, requestHost));
        }

        return response;
      } catch (fallbackErr) {
        console.log(JSON.stringify({
          tag: 'AUTH_FLOW',
          action: 'fallback_failed',
          authPath: options.authPath,
          error: fallbackErr instanceof Error ? fallbackErr.message : 'Unknown error',
        }));
      }
    }

    // ❌ No fallback allowed or fallback failed
    console.log(JSON.stringify({
      tag: 'AUTH_FLOW',
      action: 'auth_unavailable',
      authPath: options.authPath,
      reason: AUTH_CONFIG.ENABLE_FALLBACK ? 'fallback_failed' : 'fallback_disabled',
    }));

    return NextResponse.json(
      { error: 'Authentication unavailable (no fallback)' },
      { status: 503 }
    );
  }
}
